/** Yorumlar (mobil): iç içe yorum ağacı, yorum yaz, yanıtla, yorumu beğen. */
import { ChatCircle, Heart } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchComments, getSavedAuthor, postComment, saveAuthor, toggleReaction } from '@/lib/api';
import { fonts, useTheme } from '@/lib/theme';
import { useDeviceKey } from '@/lib/use-device-key';
import type { Comment, TargetType } from '@/lib/types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

function CommentForm({
  onSubmit,
  compact,
}: {
  onSubmit: (author: string, body: string) => Promise<void>;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSavedAuthor().then((a) => a && setAuthor(a));
  }, []);

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const name = author.trim() || 'Misafir';
      await saveAuthor(name);
      await onSubmit(name, body.trim());
      setBody('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.form, { backgroundColor: colors.surfaceSunken, borderColor: colors.rule }]}>
      <TextInput
        value={author}
        onChangeText={setAuthor}
        placeholder="Adınız (isteğe bağlı)"
        placeholderTextColor={colors.ink3}
        style={[styles.input, { borderColor: colors.ruleStrong, color: colors.ink0, backgroundColor: colors.surfaceCard }]}
      />
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={compact ? 'Yanıtınız…' : 'Yorumunuzu yazın…'}
        placeholderTextColor={colors.ink3}
        multiline
        style={[styles.input, styles.textarea, { borderColor: colors.ruleStrong, color: colors.ink0, backgroundColor: colors.surfaceCard }]}
      />
      <TouchableOpacity
        onPress={submit}
        disabled={busy || !body.trim()}
        style={[styles.submit, { backgroundColor: colors.red0, opacity: busy || !body.trim() ? 0.5 : 1 }]}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.textOnDark }}>
          {busy ? 'Gönderiliyor…' : compact ? 'Yanıtla' : 'Yorum Yap'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CommentNode({
  comment, targetType, targetId, depth, onPosted,
}: {
  comment: Comment; targetType: TargetType; targetId: number; depth: number; onPosted: () => void;
}) {
  const { colors } = useTheme();
  const dev = useDeviceKey();
  const [replying, setReplying] = useState(false);
  const [likes, setLikes] = useState(comment.likes);
  const [liked, setLiked] = useState(false);

  const like = async () => {
    if (!dev) return;
    const r = await toggleReaction('Comment', comment.id, 'Like', dev);
    setLikes(r.count);
    setLiked(r.active);
  };

  const reply = async (author: string, body: string) => {
    await postComment({ targetType, targetId, parentId: comment.id, authorName: author, deviceKey: dev, body });
    setReplying(false);
    onPosted();
  };

  return (
    <View style={[styles.comment, { borderTopColor: colors.rule }]}>
      <View style={styles.commentMeta}>
        <Text style={[styles.author, { color: colors.ink0 }]}>{comment.authorName}</Text>
        <Text style={[styles.date, { color: colors.ink3 }]}>{timeAgo(comment.createdAtUtc)}</Text>
      </View>
      <Text style={[styles.body, { color: colors.ink1 }]}>{comment.body}</Text>
      <View style={styles.tools}>
        <TouchableOpacity style={styles.tool} onPress={like}>
          <Heart size={14} weight={liked ? 'fill' : 'regular'} color={liked ? colors.red0 : colors.ink2} />
          <Text style={[styles.toolText, { color: liked ? colors.red0 : colors.ink2 }]}>{likes > 0 ? likes : 'Beğen'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tool} onPress={() => setReplying((r) => !r)}>
          <ChatCircle size={14} color={colors.ink2} />
          <Text style={[styles.toolText, { color: colors.ink2 }]}>Yanıtla</Text>
        </TouchableOpacity>
      </View>
      {replying ? <View style={{ marginTop: 8 }}><CommentForm compact onSubmit={reply} /></View> : null}
      {comment.replies.length > 0 && depth < 4 ? (
        <View style={[styles.children, { borderLeftColor: colors.rule }]}>
          {comment.replies.map((c) => (
            <CommentNode key={c.id} comment={c} targetType={targetType} targetId={targetId} depth={depth + 1} onPosted={onPosted} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function Comments({ targetType, targetId }: { targetType: TargetType; targetId: number }) {
  const { colors } = useTheme();
  const dev = useDeviceKey();
  const [comments, setComments] = useState<Comment[] | null>(null);

  const load = useCallback(() => {
    if (targetId > 0) fetchComments(targetType, targetId).then(setComments).catch(() => setComments([]));
  }, [targetType, targetId]);
  useEffect(() => { load(); }, [load]);

  const count = (cs: Comment[]): number => cs.reduce((n, c) => n + 1 + count(c.replies), 0);

  const add = async (author: string, body: string) => {
    await postComment({ targetType, targetId, authorName: author, deviceKey: dev, body });
    load();
  };

  return (
    <View>
      <Text style={[styles.heading, { color: colors.ink0 }]}>
        Yorumlar{comments && comments.length ? ` · ${count(comments)}` : ''}
      </Text>
      <CommentForm onSubmit={add} />
      {comments === null ? (
        <ActivityIndicator color={colors.red0} style={{ marginVertical: 16 }} />
      ) : comments.length === 0 ? (
        <Text style={[styles.empty, { color: colors.ink2 }]}>İlk yorumu siz yapın.</Text>
      ) : (
        comments.map((c) => (
          <CommentNode key={c.id} comment={c} targetType={targetType} targetId={targetId} depth={0} onPosted={load} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.ottoman, fontSize: 22, marginBottom: 8 },
  form: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 9, marginBottom: 18 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9, fontFamily: fonts.sans, fontSize: 14 },
  textarea: { minHeight: 68, textAlignVertical: 'top', fontFamily: fonts.serif },
  submit: { alignSelf: 'flex-end', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9 },
  comment: { paddingVertical: 12, borderTopWidth: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  author: { fontFamily: fonts.sansBold, fontSize: 13.5 },
  date: { fontFamily: fonts.sans, fontSize: 12 },
  body: { fontFamily: fonts.serif, fontSize: 14.5, lineHeight: 21, marginBottom: 8 },
  tools: { flexDirection: 'row', gap: 16 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  toolText: { fontFamily: fonts.sansSemi, fontSize: 12.5 },
  children: { marginLeft: 16, paddingLeft: 12, borderLeftWidth: 2, marginTop: 4 },
  empty: { fontFamily: fonts.serifItalic, fontSize: 14, paddingVertical: 12 },
});
