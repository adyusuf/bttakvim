/** Keşfet — blog listesi, yazı görünümü ve interaktif harita. */
import {
  BookOpenText,
  Buildings,
  CaretLeft,
  CastleTurret,
  Clock,
  MagnifyingGlass,
  MapTrifold,
  ShareNetwork,
  UserFocus,
} from 'phosphor-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Label } from '@/components/bits';
import { DEMO_MAPS, InteractiveMap } from '@/components/interactive-map';
import { fetchBlogCategories, fetchBlogPost, fetchBlogPosts } from '@/lib/api';
import { fonts, useTheme, type ThemeColors } from '@/lib/theme';
import type { BlogCategoryRef, BlogPost, BlogPostRef } from '@/lib/types';

const COVER_PHOTOS: Record<string, any> = {
  sehirler: require('../../assets/photos/foto-tas-ev-w.jpg'),
  haritalar: require('../../assets/photos/foto-ege-deniz-w.jpg'),
};

function categoryVisual(slug: string, c: ThemeColors) {
  switch (slug) {
    case 'tarihi-olaylar': return { Ikon: CastleTurret, renk: c.red0 };
    case 'sehirler': return { Ikon: Buildings, renk: c.blue0 };
    case 'onemli-sahsiyetler': return { Ikon: UserFocus, renk: c.gold0 };
    case 'haritalar': return { Ikon: MapTrifold, renk: c.blue1 };
    default: return { Ikon: BookOpenText, renk: c.green0 };
  }
}

function Kapak({ post, h, iconSize }: { post: BlogPostRef; h: number; iconSize: number }) {
  const { colors } = useTheme();
  const { Ikon, renk } = categoryVisual(post.categorySlug, colors);
  const photo = post.coverImageUrl ? { uri: post.coverImageUrl } : COVER_PHOTOS[post.categorySlug];
  if (photo) {
    return (
      <View style={{ height: h, overflow: 'hidden' }}>
        <Image source={photo} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: renk }} />
      </View>
    );
  }
  return (
    <View style={{ height: h, overflow: 'hidden', backgroundColor: colors.surfaceCard, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: renk, opacity: 0.12 }} />
      <View style={{ position: 'absolute', right: -8, bottom: -14, opacity: 0.16 }}>
        <Ikon size={h * 1.1} color={renk} weight="fill" />
      </View>
      <Ikon size={iconSize} color={renk} weight="fill" />
    </View>
  );
}

function PostMeta({ post }: { post: BlogPostRef }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Clock size={12} color={colors.ink3} />
      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.ink2 }}>
        {post.readingMinutes} dk
      </Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.ink2 }}>·</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.ink2 }}>
        {new Date(post.publishedAtUtc).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </Text>
    </View>
  );
}

function OneCikanKart({ post, onOpen }: { post: BlogPostRef; onOpen: (s: string) => void }) {
  const { colors } = useTheme();
  const { renk } = categoryVisual(post.categorySlug, colors);
  return (
    <TouchableOpacity
      onPress={() => onOpen(post.slug)}
      style={{
        backgroundColor: colors.surfaceCard,
        borderWidth: 1,
        borderColor: colors.rule,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
      <View>
        <Kapak post={post} h={118} iconSize={50} />
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: colors.surfaceInk,
          }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.gold2 }}>
            Öne Çıkan
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 15, paddingTop: 13, paddingBottom: 16 }}>
        <Label size={9} color={renk}>{post.categoryName}</Label>
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 20, lineHeight: 24, color: colors.ink0, marginVertical: 5 }}>
          {post.title}
        </Text>
        <Text style={{ fontFamily: fonts.serif, fontSize: 13.5, lineHeight: 20, color: colors.ink1, marginBottom: 9 }}>
          {post.summary}
        </Text>
        <PostMeta post={post} />
      </View>
    </TouchableOpacity>
  );
}

function YaziKart({ post, onOpen }: { post: BlogPostRef; onOpen: (s: string) => void }) {
  const { colors } = useTheme();
  const { renk } = categoryVisual(post.categorySlug, colors);
  return (
    <TouchableOpacity
      onPress={() => onOpen(post.slug)}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceCard,
        borderWidth: 1,
        borderColor: colors.rule,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
      <View style={{ width: 92 }}>
        <Kapak post={post} h={104} iconSize={30} />
      </View>
      <View style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 12 }}>
        <Label size={9} color={renk}>{post.categoryName}</Label>
        <Text style={{ fontFamily: fonts.serifSemi, fontSize: 15, lineHeight: 19, color: colors.ink0, marginTop: 4, marginBottom: 5 }}>
          {post.title}
        </Text>
        <PostMeta post={post} />
      </View>
    </TouchableOpacity>
  );
}

function ArticleView({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { colors } = useTheme();
  const [post, setPost] = useState<BlogPost | null>(null);
  useEffect(() => {
    fetchBlogPost(slug).then(setPost);
  }, [slug]);

  if (!post) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.red0} size="large" />
      </View>
    );
  }
  const { renk } = categoryVisual(post.categorySlug, colors);
  const harita = DEMO_MAPS[post.slug];
  const paragraphs = post.body.split('\n\n');

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
      <TouchableOpacity
        onPress={onBack}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingBottom: 6 }}>
        <CaretLeft size={17} weight="bold" color={colors.red0} />
        <Text style={{ fontFamily: fonts.sansSemi, fontSize: 14, color: colors.red0 }}>Keşfet</Text>
      </TouchableOpacity>
      <Kapak post={post} h={172} iconSize={62} />
      <View style={{ paddingHorizontal: 18, marginTop: -28 }}>
        <View
          style={{
            backgroundColor: colors.surfaceCard,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.rule,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 4,
          }}>
          <Label size={10} color={renk}>{post.categoryName}</Label>
          <Text style={{ fontFamily: fonts.displayX, fontSize: 25, lineHeight: 29, color: colors.ink0, marginTop: 7, marginBottom: 9 }}>
            {post.title}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingBottom: 13,
              borderBottomWidth: 1,
              borderBottomColor: colors.rule,
              marginBottom: 14,
            }}>
            <Clock size={13} color={colors.ink3} />
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.ink2 }}>
              {post.readingMinutes} dk okuma
            </Text>
          </View>

          {paragraphs.map((p, i) => (
            <Text
              key={i}
              style={{
                fontFamily: fonts.serif,
                fontSize: 15,
                lineHeight: 24.5,
                color: colors.ink1,
                marginBottom: 14,
                textAlign: 'justify',
              }}>
              {p}
            </Text>
          ))}

          {harita ? <InteractiveMap harita={harita} /> : null}

          <TouchableOpacity
            onPress={() => Share.share({ message: `${post.title} — BTTakvim` })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: colors.rule,
              marginTop: 4,
            }}>
            <ShareNetwork size={19} color={colors.ink1} />
            <Text style={{ fontFamily: fonts.sansSemi, fontSize: 12, color: colors.ink1 }}>Paylaş</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default function KesfetScreen() {
  const { colors } = useTheme();
  const [posts, setPosts] = useState<BlogPostRef[]>([]);
  const [categories, setCategories] = useState<BlogCategoryRef[]>([]);
  const [aktifKat, setAktifKat] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [article, setArticle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchBlogPosts(), fetchBlogCategories()]).then(([p, c]) => {
      setPosts(p);
      setCategories(c);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = posts;
    if (aktifKat) list = list.filter((p) => p.categorySlug === aktifKat);
    if (query.trim()) {
      const q = query.trim().toLocaleLowerCase('tr');
      list = list.filter(
        (p) =>
          p.title.toLocaleLowerCase('tr').includes(q) ||
          p.summary.toLocaleLowerCase('tr').includes(q),
      );
    }
    return list;
  }, [posts, aktifKat, query]);

  const oneCikan = !aktifKat && !query.trim() ? filtered[0] : undefined;
  const liste = oneCikan ? filtered.slice(1) : filtered;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceApp }} edges={['top']}>
      {article ? (
        <ArticleView slug={article} onBack={() => setArticle(null)} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: fonts.displayX, fontSize: 30, color: colors.ink0, marginTop: 4 }}>
              Keşfet
            </Text>
            <Text style={{ fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink2, marginBottom: 14, marginTop: 2 }}>
              Tarih, gelenek ve kültürden seçmeler
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 9,
                backgroundColor: colors.surfaceCard,
                borderWidth: 1,
                borderColor: colors.ruleStrong,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 4,
                marginBottom: 14,
              }}>
              <MagnifyingGlass size={16} color={colors.ink2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Konu, şehir ya da kişi ara…"
                placeholderTextColor={colors.ink3}
                style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink0, paddingVertical: 6 }}
              />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
            {[{ slug: null as string | null, name: 'Tümü' }, ...categories].map((k) => {
              const aktif = k.slug === aktifKat;
              return (
                <TouchableOpacity
                  key={k.slug ?? 'tumu'}
                  onPress={() => setAktifKat(k.slug)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: aktif ? colors.ink0 : colors.ruleStrong,
                    backgroundColor: aktif ? colors.ink0 : 'transparent',
                  }}>
                  <Text
                    style={{
                      fontFamily: fonts.sansSemi,
                      fontSize: 12.5,
                      color: aktif ? colors.textOnDark : colors.ink1,
                    }}>
                    {k.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {loading ? (
              <ActivityIndicator color={colors.red0} style={{ marginVertical: 30 }} />
            ) : (
              <>
                {oneCikan ? <OneCikanKart post={oneCikan} onOpen={setArticle} /> : null}
                {liste.map((p) => (
                  <YaziKart key={p.slug} post={p} onOpen={setArticle} />
                ))}
                {filtered.length === 0 ? (
                  <Text
                    style={{
                      textAlign: 'center',
                      paddingVertical: 30,
                      fontFamily: fonts.serifItalic,
                      fontSize: 14,
                      color: colors.ink2,
                    }}>
                    Bu kategoride yakında yeni yazılar.
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
