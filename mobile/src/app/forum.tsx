/** Forum — konu listesi, konu detayı (tepki + yorum dizisi), yeni konu açma. */
import { CaretLeft, ChatCircle, Heart, Plus } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Label, Ornament } from '@/components/bits';
import { Comments } from '@/components/comments';
import { ReactionBar } from '@/components/reaction-bar';
import {
  createForumTopic, fetchForumTopic, fetchForumTopics, getSavedAuthor, saveAuthor,
} from '@/lib/api';
import { useDeviceKey } from '@/lib/use-device-key';
import { fonts, useTheme } from '@/lib/theme';
import type { ForumTopic, ForumTopicRef } from '@/lib/types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'bugün';
  if (hrs < 24) return `${hrs} saat önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function NewTopic({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { colors } = useTheme();
  const dev = useDeviceKey();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { getSavedAuthor().then((a) => a && setAuthor(a)); }, []);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const name = author.trim() || 'Misafir';
      await saveAuthor(name);
      await createForumTopic({ title: title.trim(), body: body.trim(), authorName: name, deviceKey: dev });
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: 8, paddingHorizontal: 11,
    paddingVertical: 9, fontFamily: fonts.sans, fontSize: 14, color: colors.ink0, backgroundColor: colors.surfaceCard,
  };

  return (
    <View style={{ backgroundColor: colors.surfaceSunken, borderWidth: 1, borderColor: colors.rule, borderRadius: 12, padding: 14, gap: 9, marginBottom: 18 }}>
      <TextInput value={title} onChangeText={setTitle} placeholder="Konu başlığı" placeholderTextColor={colors.ink3} style={inputStyle} />
      <TextInput value={body} onChangeText={setBody} placeholder="Açıklama (isteğe bağlı)" placeholderTextColor={colors.ink3} multiline style={[inputStyle, { minHeight: 70, textAlignVertical: 'top', fontFamily: fonts.serif }]} />
      <TextInput value={author} onChangeText={setAuthor} placeholder="Adınız (isteğe bağlı)" placeholderTextColor={colors.ink3} style={inputStyle} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
        <TouchableOpacity onPress={onCancel} style={{ paddingHorizontal: 14, paddingVertical: 9 }}>
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink2 }}>Vazgeç</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={submit} disabled={busy || !title.trim()} style={{ backgroundColor: colors.red0, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9, opacity: busy || !title.trim() ? 0.5 : 1 }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: colors.textOnDark }}>{busy ? 'Açılıyor…' : 'Konuyu Aç'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TopicDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { colors } = useTheme();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  useEffect(() => { fetchForumTopic(id).then(setTopic).catch(() => setTopic(null)); }, [id]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <CaretLeft size={17} weight="bold" color={colors.red0} />
        <Text style={{ fontFamily: fonts.sansSemi, fontSize: 14, color: colors.red0 }}>Forum</Text>
      </TouchableOpacity>
      {!topic ? (
        <ActivityIndicator color={colors.red0} style={{ marginVertical: 30 }} />
      ) : (
        <>
          <View style={{ backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.rule, borderRadius: 16, padding: 18, marginBottom: 18 }}>
            <Text style={{ fontFamily: fonts.ottoman, fontSize: 24, color: colors.ink0, marginBottom: 6 }}>{topic.title}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink2, marginBottom: 10 }}>
              {topic.authorName} · {timeAgo(topic.createdAtUtc)}
            </Text>
            {topic.body ? <Text style={{ fontFamily: fonts.serif, fontSize: 15, lineHeight: 23, color: colors.ink1, marginBottom: 14 }}>{topic.body}</Text> : null}
            <ReactionBar targetType="ForumTopic" targetId={topic.id} shareMessage={`${topic.title} — BTTakvim Forum`} />
          </View>
          <Comments targetType="ForumTopic" targetId={topic.id} />
        </>
      )}
    </ScrollView>
  );
}

export default function ForumScreen() {
  const { colors } = useTheme();
  const [topics, setTopics] = useState<ForumTopicRef[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);

  const load = () => fetchForumTopics().then(setTopics).catch(() => setTopics([]));
  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceApp }} edges={['top']}>
      {openId !== null ? (
        <TopicDetail id={openId} onBack={() => { setOpenId(null); load(); }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <Text style={{ fontFamily: fonts.displayX, fontSize: 30, color: colors.ink0, marginTop: 4 }}>Forum</Text>
          <Text style={{ fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink2, marginTop: 2 }}>
            Yapraklar ve yazılar üzerine sohbet edin
          </Text>
          <Ornament style={{ marginVertical: 14 }} />

          {composing ? (
            <NewTopic onCreated={() => { setComposing(false); load(); }} onCancel={() => setComposing(false)} />
          ) : (
            <TouchableOpacity
              onPress={() => setComposing(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', backgroundColor: colors.red0, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 18 }}>
              <Plus size={16} color={colors.textOnDark} />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: colors.textOnDark }}>Yeni Konu Aç</Text>
            </TouchableOpacity>
          )}

          <View style={{ gap: 12 }}>
            {topics.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setOpenId(t.id)}
                style={{ backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.rule, borderRadius: 12, padding: 16 }}>
                <Text style={{ fontFamily: fonts.serifBold, fontSize: 17, color: colors.ink0, marginBottom: 5 }}>{t.title}</Text>
                {t.body ? (
                  <Text numberOfLines={2} style={{ fontFamily: fonts.serif, fontSize: 13.5, lineHeight: 19, color: colors.ink2, marginBottom: 9 }}>{t.body}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Label size={11} color={colors.ink3}>{t.authorName}</Label>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <ChatCircle size={13} color={colors.ink3} />
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.ink3 }}>{t.commentCount}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Heart size={13} color={colors.ink3} />
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.ink3 }}>{t.likeCount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
