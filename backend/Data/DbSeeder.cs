using System.Text.Json;
using BTTakvim.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.ContentCategories.AnyAsync())
        {
            await EnsureAdditionsAsync(db);
            return;
        }

        // ---- Ayarlar ----
        db.Settings.AddRange(
            new AppSetting { Key = "content_mode", Value = "random" }, // random | fixed
            // ---- Entegrasyon ayarları (admin panelinden düzenlenebilir) ----
            // Hicrî gün-ofseti: UmAlQura hesabını Diyanet ilanına ±gün hizalar (yedek: appsettings Calendar:HijriDayOffset, ardından 0).
            new AppSetting { Key = "hijri_day_offset", Value = "0" },
            // Namaz vakti varsayılanları: istemci parametre göndermezse kullanılır (istemci değeri yine de geçersiz kılar).
            new AppSetting { Key = "prayer_default_method", Value = "13" },   // 13 = Diyanet
            new AppSetting { Key = "prayer_default_school", Value = "0" },    // 0 = Şâfiî/standart, 1 = Hanefî
            new AppSetting { Key = "prayer_default_tune", Value = "0,0,0,0,0,0" }); // imsak,gunes,ogle,ikindi,aksam,yatsi

        // ---- İçerik kategorileri ----
        var categories = new Dictionary<string, ContentCategory>();
        var categoryDefs = new (string Slug, string Name, string Icon)[]
        {
            ("ozel-gunler", "Özel Günler", "🎉"),
            ("gunun-sohbeti", "Günün Sohbeti", "🌷"),
            ("gunun-menusu", "Günün Menüsü", "🍲"),
            ("biraz-da-felsefe", "Biraz da Felsefe", "🧠"),
            ("gastronomi", "Yemek Kültürü", "🍲"),
            ("ilginc-bilgiler", "İlginç Bilgiler", "💡"),
            ("bir-kelime", "Bir Kelime", "📖"),
            ("cografya", "Coğrafya", "🗺️"),
            ("efsaneler", "Efsaneler", "🐉"),
            ("bir-siir", "Bir Şiir", "🪶"),
            ("ruya-tabiri", "Rüya Tabiri", "🌙"),
            ("faydali-bilgiler", "Faydalı Bilgiler", "✅"),
            ("demografik-bilgiler", "Demografik Bilgiler", "📊"),
            ("yer-adlari", "Yer Adları", "📍"),
            ("sudoku", "Sudoku", "🔢"),
            ("bulmaca", "Bulmaca", "🧩"),
        };
        int sort = 0;
        foreach (var (slug, name, icon) in categoryDefs)
        {
            var c = new ContentCategory { Slug = slug, Name = name, Icon = icon, SortOrder = ++sort };
            categories[slug] = c;
            db.ContentCategories.Add(c);
        }

        // ---- İçerik öğeleri ----
        void Item(string cat, string title, string body, int? month = null, int? day = null) =>
            db.ContentItems.Add(new ContentItem
            {
                Category = categories[cat],
                Title = title,
                Body = body,
                PinnedMonth = month,
                PinnedDay = day,
                CreatedAtUtc = DateTime.UtcNow,
            });

        // Özel günler — ay/güne sabitli
        Item("ozel-gunler", "Yılbaşı", "Yeni yılınız kutlu olsun! (Bütçe yılı başlangıcı)", 1, 1);
        Item("ozel-gunler", "Dünya Kadınlar Günü", "8 Mart Dünya Kadınlar Günü kutlu olsun.", 3, 8);
        Item("ozel-gunler", "Ulusal Egemenlik ve Çocuk Bayramı", "TBMM'nin açılışı (1920). Çocuk bayramı kutlu olsun!", 4, 23);
        Item("ozel-gunler", "Emek ve Dayanışma Günü", "1 Mayıs Emek ve Dayanışma Günü.", 5, 1);
        Item("ozel-gunler", "Atatürk'ü Anma, Gençlik ve Spor Bayramı", "Atatürk'ün Samsun'a çıkışı (1919).", 5, 19);
        Item("ozel-gunler", "Dünya Çevre Günü", "5 Haziran Dünya Çevre Günü.", 6, 5);
        Item("ozel-gunler", "Zafer Bayramı", "Büyük Taarruz'un zaferle sonuçlanması (1922).", 8, 30);
        Item("ozel-gunler", "Cumhuriyet Bayramı", "Cumhuriyet'in ilanı (1923). Bayramınız kutlu olsun!", 10, 29);
        Item("ozel-gunler", "Atatürk'ü Anma Günü", "Gazi Mustafa Kemal Atatürk'ün ebediyete intikali (1938).", 11, 10);
        Item("ozel-gunler", "Öğretmenler Günü", "24 Kasım Öğretmenler Günü kutlu olsun.", 11, 24);

        AddSohbetVeMenuItems(db, categories["gunun-sohbeti"], categories["gunun-menusu"]);

        // Biraz da felsefe
        Item("biraz-da-felsefe", "Her An Felsefe",
            "Düşünce dünyası geliştikçe felsefe üç büyük sorun üzerinde yoğunlaşmıştır: doğanın işleri, insanın işleri ve bu ikisi arasında üretken ilişkiler kurma çabası. Kendimize, dünyaya ve yapıp ettiklerimize dair her düşündüğümüzde aslında bir yanıyla felsefe yapmış oluruz.");
        Item("biraz-da-felsefe", "Sokrates ve Bilgelik",
            "Sokrates'e göre bilgeliğin başlangıcı, insanın bilmediğini bilmesidir. \"Sorgulanmamış hayat yaşanmaya değmez\" sözü, kendi hayatımızı düşünce süzgecinden geçirme çağrısıdır.");
        Item("biraz-da-felsefe", "Stoacılık Üzerine",
            "Stoacılar, elimizde olanla olmayanı ayırt etmeyi öğütler. Epiktetos'a göre bizi üzen şeyler değil, onlara yüklediğimiz anlamlardır. İç huzur, kontrol edemediklerimizi kabullenmekle başlar.");
        Item("biraz-da-felsefe", "İbn Haldun ve Toplum",
            "İbn Haldun, Mukaddime'de toplumların da canlılar gibi doğup büyüyüp yaşlandığını söyler. \"Coğrafya kaderdir\" sözüyle, insan topluluklarının yaşadıkları çevreden bağımsız düşünülemeyeceğini anlatır.");

        // Gastronomi
        Item("gastronomi", "Gastronom ve Gurme",
            "Gastronomi, insanların yaşamlarını sürdürebilmeleri için gerekli olan beslenme konusunu araştıran bir bilim dalıdır. Bu işle ilgili araştırmalar yapan kişiye gastronom denir. Gastronomlar bir gurme değildir; gurmeler gibi öncelikle damak tadına odaklanmazlar, araştırma yaparak topluma yarar üretirler.");
        Item("gastronomi", "Tarhananın Hikâyesi",
            "Tarhana, Orta Asya'dan Anadolu'ya taşınan en eski hazır çorbalardan biridir. Yoğurt, un ve sebzelerin fermente edilmesiyle yapılır; kışın vitamin deposu olarak köy evlerinin vazgeçilmezidir.");
        Item("gastronomi", "Kahvenin Anadolu Yolculuğu",
            "Kahve, 16. yüzyılda Yemen'den İstanbul'a geldi ve kısa sürede kahvehane kültürünü doğurdu. \"Bir fincan kahvenin kırk yıl hatırı vardır\" sözü bu kültürün özetidir.");
        Item("gastronomi", "Zeytinyağının Sırrı",
            "Akdeniz mutfağının temeli zeytinyağı, soğuk sıkım ile elde edildiğinde aromasını ve besin değerini korur. Erken hasat (yeşil) zeytinden yapılan yağlar daha yüksek polifenol içerir.");

        // İlginç bilgiler
        Item("ilginc-bilgiler", "Bal Bozulmaz",
            "Arkeologlar Mısır piramitlerinde 3000 yıllık, hâlâ yenilebilir durumda bal bulmuşlardır. Balın düşük nem ve asidik yapısı bakterilerin üremesine izin vermez.");
        Item("ilginc-bilgiler", "Ahtapotların Üç Kalbi Vardır",
            "Ahtapotların üç kalbi ve mavi kanı vardır. İki kalp solungaçlara, biri vücuda kan pompalar; yüzerken vücut kalbi durur, bu yüzden yüzmek onları çok yorar.");
        Item("ilginc-bilgiler", "Işık Yılı Bir Zaman Değildir",
            "Işık yılı zamanı değil mesafeyi ölçer: Işığın bir yılda aldığı yol, yaklaşık 9,46 trilyon kilometredir. Gökyüzüne baktığımızda aslında geçmişi görürüz.");
        Item("ilginc-bilgiler", "Eyfel Kulesi Yazın Uzar",
            "Demir sıcakta genleştiği için Eyfel Kulesi yaz aylarında 15 santimetreye kadar uzayabilir.");

        // Bir kelime
        Item("bir-kelime", "Yâren",
            "Yâren: Yakın dost, arkadaş. Farsça kökenlidir. Anadolu'da \"yârenlik etmek\", dostça sohbet etmek anlamında yaşamaya devam eder.");
        Item("bir-kelime", "Müteşekkir",
            "Müteşekkir: Teşekkür borçlu, minnettar. Arapça \"şükr\" kökünden türemiştir. \"Size müteşekkirim\" demek, kalpten gelen bir teşekkürü ifade eder.");
        Item("bir-kelime", "Gönül",
            "Gönül: Sevgi, istek ve düşüncenin kaynağı sayılan iç dünya. Türkçenin en eski kelimelerinden biridir; \"gönül almak\", \"gönül vermek\" gibi onlarca deyim üretmiştir.");
        Item("bir-kelime", "Hasbihâl",
            "Hasbihâl: Hâl hatır sorma, içten sohbet. Arapça \"hasb\" (göre) ve \"hâl\" kelimelerinden oluşur; dertleşme anlamında kullanılır.");

        // Coğrafya
        Item("cografya", "Türkiye'nin En Uzun Nehri",
            "Kızılırmak, 1.355 kilometre ile tamamı Türkiye sınırları içinde akan en uzun nehirdir. Sivas'tan doğar, geniş bir yay çizerek Bafra'da Karadeniz'e dökülür.");
        Item("cografya", "Van Gölü",
            "Van Gölü, 3.713 km² yüzölçümü ile Türkiye'nin en büyük gölüdür. Sodalı suyu sayesinde donmaz ve dünyada yalnızca burada yaşayan inci kefaline ev sahipliği yapar.");
        Item("cografya", "İki Kıtada Bir Şehir",
            "İstanbul, dünyada iki kıta üzerine kurulu tek metropoldür. Boğaz, Karadeniz'i Marmara'ya bağlarken Asya ile Avrupa'yı 700 metreye kadar yaklaştırır.");
        Item("cografya", "Kapadokya'nın Oluşumu",
            "Kapadokya'daki peribacaları, Erciyes ve Hasan Dağı'nın püskürttüğü küllerin milyonlarca yılda rüzgâr ve suyla aşınmasıyla oluşmuştur.");

        // Efsaneler
        Item("efsaneler", "Şahmeran Efsanesi",
            "Yarı insan yarı yılan Şahmeran, yılanların bilge kraliçesidir. Tarsus'ta geçtiğine inanılan efsaneye göre sırrını dostu Camsap'a emanet etmiş, ihanete uğrasa da bilgeliğini insanlara şifa olarak bırakmıştır.");
        Item("efsaneler", "Ağrı Dağı ve Nuh'un Gemisi",
            "İnanışa göre büyük tufandan sonra Nuh'un gemisi Ağrı Dağı'na oturmuştur. Bu yüzden dağın eski adı \"Cudi-i Ararat\" olarak da anılır ve yüzyıllardır gemi kalıntısı arayanların rotasıdır.");
        Item("efsaneler", "Kız Kulesi",
            "Efsaneye göre kâhinler, kralın kızının bir yılan sokmasıyla öleceğini söyler. Kral, kızını denizin ortasındaki kuleye kapatır; ama kader, bir üzüm sepetinde gizlenen yılanla kuleye ulaşır.");

        // Bir şiir
        Item("bir-siir", "Yeni Yıl — Mahmut Boğa",
            "Bir yaş daha büyüdük / Girdik yeni yıllara / On iki ay yürüdük / Vardık yeni yıllara // Koca bir yıl devrildi / Takvim başa çevrildi / Hoş geldi, safa geldi / Erdik yeni yıla...", 1, 1);
        Item("bir-siir", "Otuz Beş Yaş — Cahit Sıtkı Tarancı (alıntı)",
            "Yaş otuz beş! Yolun yarısı eder. / Dante gibi ortasındayız ömrün. / Delikanlı çağımızdaki cevher, / Yalvarmak, yakarmak nafile bugün, / Gözünün yaşına bakmadan gider.");
        Item("bir-siir", "İstanbul'u Dinliyorum — Orhan Veli (alıntı)",
            "İstanbul'u dinliyorum, gözlerim kapalı; / Önce hafiften bir rüzgâr esiyor; / Yavaş yavaş sallanıyor / Yapraklar ağaçlarda...");
        Item("bir-siir", "Memleket İsterim — Cahit Külebi (alıntı)",
            "Memleket isterim / Gök mavi, dal yeşil, tarla sarı olsun; / Kuşların çiçeklerin diyarı olsun.");

        // Rüya tabiri
        Item("ruya-tabiri", "Rüyada Su Görmek",
            "Rüyada berrak su görmek ferahlığa, bereket ve huzura; bulanık su ise geçici sıkıntılara işaret eder. Akarsu, hayatın akışındaki değişimleri simgeler.");
        Item("ruya-tabiri", "Rüyada Uçmak",
            "Rüyada uçmak, özgürlük arzusuna ve hedeflere ulaşma isteğine yorulur. Yüksekten korkmadan uçmak, özgüvenin arttığına işarettir.");
        Item("ruya-tabiri", "Rüyada Anahtar Görmek",
            "Anahtar, kapalı kapıların açılmasına, sorunların çözülmesine ve yeni fırsatlara delalet eder.");

        // Faydalı bilgiler
        Item("faydali-bilgiler", "Limonun Tazeliğini Korumak",
            "Kesilmiş limonu kapalı bir kapta, kesik yüzü aşağı gelecek şekilde saklarsanız bir hafta tazeliğini korur. Buzdolabında bütün limonlar 3-4 hafta dayanır.");
        Item("faydali-bilgiler", "Mutluluk İçin 4 Adım",
            "1- Hata yaptığınızı anladığınız zaman düzeltmek için derhal gerekli adımları atın. 2- İstediğinizi alamamanızın bazen ne kadar büyük bir şans olduğunu hatırlayın. 3- Her zaman değişime açık olun, değerlerinizin kaybolup gitmesine de izin vermeyin. 4- Sevgi dolu, sakin, düzenli bir ev yaratmak için elinizden gelen her şeyi yapın.");
        Item("faydali-bilgiler", "Telefon Bataryası Ömrü",
            "Lityum bataryalar %20-%80 arasında tutulduğunda en uzun ömrü sunar. Geceleri %100'de fişte bırakmak batarya kimyasını yorar.");
        Item("faydali-bilgiler", "Doğru Su Tüketimi",
            "Güne bir bardak suyla başlamak metabolizmayı harekete geçirir. Susama hissi, vücudun zaten su kaybettiğinin işaretidir; beklemeden için.");

        // Demografik bilgiler
        Item("demografik-bilgiler", "Türkiye Nüfusu",
            "Türkiye nüfusu 85 milyonu aşmıştır. Nüfusun yarıdan fazlası 35 yaşın altındadır ve en kalabalık il, ülke nüfusunun yaklaşık beşte birini barındıran İstanbul'dur.");
        Item("demografik-bilgiler", "Dünyada Şehirleşme",
            "Dünya nüfusunun yarısından fazlası artık şehirlerde yaşıyor. 2050'de bu oranın üçte ikiye çıkması bekleniyor.");
        Item("demografik-bilgiler", "Ortalama Yaşam Süresi",
            "Bir asır önce 45 yıl civarında olan dünya ortalama yaşam süresi, bugün 73 yılı aşmıştır. Bunda en büyük pay temiz su, aşılar ve antibiyotiklerindir.");

        // Yer adları
        Item("yer-adlari", "İstanbul Adının Kökeni",
            "İstanbul adının, Rumca \"eis tin polin\" (şehre doğru) ifadesinden geldiği kabul edilir. Şehir tarih boyunca Byzantion, Konstantinopolis ve İslambol gibi adlarla da anılmıştır.");
        Item("yer-adlari", "Ankara'nın Adı",
            "Ankara adının, Frigce \"Ankyra\" (gemi çapası) kelimesinden geldiği sanılmaktadır. Galatlar döneminden kalma bu ad, Roma sikkelerinde çapa figürüyle birlikte basılmıştır.");
        Item("yer-adlari", "Anadolu Ne Demek?",
            "Anadolu, Rumca \"Anatole\" yani \"güneşin doğduğu yer\" anlamına gelir. Türkçede halk arasında \"ana dolu\" söyleyişiyle bereketle özdeşleşmiştir.");

        // Sudoku & Bulmaca (metin tabanlı günlük yapraklar)
        Item("sudoku", "Günün Sudoku İpucu",
            "Kolay seviye başlangıç: Önce 9 sayısının tamamlandığı blokları işaretleyin. Tek eksikli satır ve sütunlardan ilerlemek çözümü hızlandırır. Bugünün tohumlu bulmacası mobil uygulamada!");
        Item("sudoku", "Sudoku Tekniği: Tek Aday",
            "Bir hücreye yalnızca tek rakam yazılabiliyorsa o hücre \"tek aday\"dır. Tüm tabloyu taramadan önce tek adayları yerleştirin.");
        Item("bulmaca", "Günün Sorusu",
            "Hangi ay 28 gün çeker? — Cevap: Hepsi! Tüm aylar en az 28 gün çeker.");
        Item("bulmaca", "Zekâ Sorusu",
            "Bir babanın 5 kızı var: Nana, Nene, Nini, Nono... Beşinci kızın adı ne? — Cevap: Soruyu dikkatli okuyun: \"Beşinci kızın adı NE\"dir.");

        // ---- Geçmişte bugün ----
        void History(int month, int day, int year, string text) =>
            db.HistoryEvents.Add(new HistoryEvent { Month = month, Day = day, Year = year, Text = text });

        History(1, 1, 1959, "Küba'da Fidel Castro önderliğindeki devrim zafere ulaştı; diktatör Batista ülkeyi terk etti.");
        History(1, 1, 1926, "Türkiye'de miladi takvim ve uluslararası saat uygulaması başladı.");
        History(3, 18, 1915, "Çanakkale Deniz Zaferi kazanıldı.");
        History(4, 23, 1920, "Türkiye Büyük Millet Meclisi Ankara'da açıldı.");
        History(5, 19, 1919, "Mustafa Kemal Paşa, Bandırma Vapuru ile Samsun'a çıktı; Millî Mücadele başladı.");
        History(5, 29, 1453, "İstanbul, Fatih Sultan Mehmet komutasındaki Osmanlı ordusu tarafından fethedildi.");
        History(6, 5, 1972, "Birleşmiş Milletler ilk Dünya Çevre Konferansı'nı Stockholm'de topladı; 5 Haziran Dünya Çevre Günü ilan edildi.");
        History(6, 9, 1934, "Çizgi film karakteri Donald Duck, \"The Wise Little Hen\" filmiyle ilk kez izleyici karşısına çıktı.");
        History(6, 10, 1940, "İtalya, İngiltere ve Fransa'ya savaş ilan ederek İkinci Dünya Savaşı'na girdi.");
        History(6, 10, 2003, "NASA, Mars yüzeyini keşfedecek olan Spirit aracını uzaya fırlattı.");
        History(6, 11, 1942, "ABD ile Sovyetler Birliği arasında savaş yardımlaşması anlaşması imzalandı.");
        History(6, 11, 2010, "Güney Afrika'da düzenlenen FIFA Dünya Kupası, kıtanın ev sahipliği yaptığı ilk dünya kupası olarak başladı.");
        History(7, 20, 1969, "Apollo 11 göreviyle Neil Armstrong, Ay'a ayak basan ilk insan oldu.");
        History(8, 26, 1071, "Malazgirt Zaferi: Sultan Alparslan, Bizans ordusunu yenerek Anadolu'nun kapılarını açtı.");
        History(8, 30, 1922, "Büyük Taarruz, Başkomutanlık Meydan Muharebesi ile zafere ulaştı.");
        History(10, 29, 1923, "Cumhuriyet ilan edildi; Mustafa Kemal Paşa ilk Cumhurbaşkanı seçildi.");
        History(11, 10, 1938, "Gazi Mustafa Kemal Atatürk, Dolmabahçe Sarayı'nda hayata gözlerini yumdu.");
        History(12, 17, 1903, "Wright kardeşler, motorlu bir uçakla tarihteki ilk kontrollü uçuşu gerçekleştirdi.");

        // ---- Özlü sözler ----
        // Toplu, küratörlü "günün sözü" veri kümesi Data/Seed/quotes.json dosyasından
        // yüklenir (atasözleri + kaynağı sağlam vecizeler). Tablo boşken metne göre
        // tekilleştirilerek eklenir; dosya okunamazsa küçük bir gömülü liste kullanılır.
        SeedQuotes(db);

        // ---- İsimler ----
        // Küratörlü bebek ismi + anlamı veri kümesi Data/Seed/baby-names.json
        // dosyasından yüklenir. Tablo boşken (Ad, Cinsiyet) çiftine göre
        // tekilleştirilerek eklenir; dosya okunamazsa küçük bir gömülü liste
        // devreye girer (quotes.json deseninin aynısı).
        SeedNames(db);

        // ---- Blog ----
        var blogCats = new Dictionary<string, BlogCategory>();
        foreach (var (slug, name) in new[]
                 {
                     ("onemli-sahsiyetler", "Önemli Şahsiyetler"),
                     ("tarihi-olaylar", "Tarihi Olaylar"),
                     ("sehirler", "Şehirler"),
                     ("faydali-bilgiler", "Faydalı Bilgiler"),
                     ("haritalar", "Haritalar"),
                 })
        {
            var c = new BlogCategory { Slug = slug, Name = name };
            blogCats[slug] = c;
            db.BlogCategories.Add(c);
        }

        void Post(string cat, string slug, string title, string summary, string body) =>
            db.BlogPosts.Add(new BlogPost
            {
                Category = blogCats[cat],
                Slug = slug,
                Title = title,
                Summary = summary,
                Body = body,
                IsPublished = true,
                PublishedAtUtc = DateTime.UtcNow,
                CreatedAtUtc = DateTime.UtcNow,
            });

        Post("onemli-sahsiyetler", "mimar-sinan", "Mimar Sinan: Taşın Şairi",
            "Üç padişaha baş mimarlık yapan Sinan'ın hayatı ve eserleri.",
            "Mimar Sinan (1489-1588), Osmanlı mimarisinin zirve ismidir. Kayseri'de doğdu, devşirme olarak Yeniçeri Ocağı'na girdi ve baş mimarlığa kadar yükseldi.\n\nÇıraklık eserim dediği Şehzade Camii, kalfalık eserim dediği Süleymaniye ve ustalık eserim dediği Edirne Selimiye, mimarlık tarihinin başyapıtları arasındadır. 84 cami, 52 mescit, 57 medrese ve onlarca köprü, kervansaray ve hamam inşa etmiştir.");
        Post("tarihi-olaylar", "istanbulun-fethi", "İstanbul'un Fethi: Bir Çağın Kapanışı",
            "29 Mayıs 1453'te İstanbul'un fethi ve dünya tarihine etkileri.",
            "29 Mayıs 1453 sabahı, 21 yaşındaki II. Mehmet'in ordusu 53 günlük kuşatmanın ardından surları aştı. Orta Çağ kapandı, Yeni Çağ başladı.\n\nGemilerin karadan yürütülmesi, şahi toplarının dökümü ve Haliç'e kurulan köprü, kuşatmanın efsaneleşen unsurlarıdır.");
        Post("sehirler", "mardin", "Mardin: Taş Evlerin Şehri",
            "Mezopotamya ovasına bakan taş şehir Mardin'in hikâyesi.",
            "Mardin, Mezopotamya ovasına tepeden bakan kadim bir şehirdir. Sarı kalker taşından oyulmuş evleri, daracık sokakları ve abbaraları ile açık hava müzesi gibidir.\n\nDeyrulzafaran Manastırı, Kasımiye Medresesi ve Ulu Cami, şehrin çok kültürlü geçmişinin tanıklarıdır.");
        Post("faydali-bilgiler", "su-tasarrufu", "Evde Su Tasarrufunun 10 Yolu",
            "Küçük alışkanlık değişiklikleriyle su faturanızı düşürün.",
            "1. Diş fırçalarken musluğu kapatın (günde 12 litre tasarruf).\n2. Damlatan muslukları onarın.\n3. Bulaşık makinesini tam doldurmadan çalıştırmayın.\n4. Duş süresini 5 dakikaya indirin.\n5. Sebzeleri akan suda değil, kapta yıkayın...");
        Post("haritalar", "piri-reis-haritasi", "Piri Reis Haritası'nın Sırrı",
            "1513 tarihli dünya haritasının bilinmeyenleri.",
            "Piri Reis'in 1513'te çizdiği dünya haritası, Amerika kıyılarını gösteren en eski haritalardan biridir. Ceylan derisi üzerine çizilen harita, 1929'da Topkapı Sarayı'nda bulunmuştur.\n\nHaritanın kenar notlarında Piri Reis, Kristof Kolomb'un haritası dahil 20'den fazla kaynaktan yararlandığını yazar.");

        // ---- Forum başlangıç konusu ----
        db.ForumTopics.Add(new ForumTopic
        {
            Title = "BTTakvim'e hoş geldiniz!",
            Body = "Takvim yaprakları ve blog yazıları hakkındaki tartışmalarınızı burada bulabilir, yeni konular açabilirsiniz.",
            AuthorName = "BTTakvim",
            DeviceKey = "system",
            CreatedAtUtc = DateTime.UtcNow,
        });

        // ---- Admin ----
        db.AdminUsers.Add(new AdminUser
        {
            Email = "admin@bttakvim.local",
            Name = "Yönetici",
            // Geliştirme girişi: admin@bttakvim.local / admin123!
            PasswordHash = Services.AuthService.HashPassword("admin123!"),
        });

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Tasarım sistemiyle gelen yeni kategorileri mevcut (daha önce seed edilmiş)
    /// veritabanına idempotent olarak ekler.
    /// </summary>
    private static async Task EnsureAdditionsAsync(AppDbContext db)
    {
        await EnsureSettingsAsync(db);

        if (await db.ContentCategories.AnyAsync(c => c.Slug == "gunun-sohbeti")) return;

        var maxSort = await db.ContentCategories.MaxAsync(c => (int?)c.SortOrder) ?? 0;
        var sohbet = new ContentCategory { Slug = "gunun-sohbeti", Name = "Günün Sohbeti", Icon = "🌷", SortOrder = maxSort + 1 };
        var menu = new ContentCategory { Slug = "gunun-menusu", Name = "Günün Menüsü", Icon = "🍲", SortOrder = maxSort + 2 };
        db.ContentCategories.AddRange(sohbet, menu);
        AddSohbetVeMenuItems(db, sohbet, menu);
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Daha önce seed edilmiş (yükseltilen) veritabanlarına yeni entegrasyon ayarı
    /// anahtarlarını idempotent ekler. Yalnızca eksik anahtarlar eklenir; mevcut
    /// değerler korunur (üzerine yazılmaz).
    /// </summary>
    private static async Task EnsureSettingsAsync(AppDbContext db)
    {
        var defaults = new (string Key, string Value)[]
        {
            ("hijri_day_offset", "0"),
            ("prayer_default_method", "13"),
            ("prayer_default_school", "0"),
            ("prayer_default_tune", "0,0,0,0,0,0"),
        };

        var existing = await db.Settings.Select(s => s.Key).ToListAsync();
        var existingSet = new HashSet<string>(existing);

        var added = false;
        foreach (var (key, value) in defaults)
        {
            if (existingSet.Contains(key)) continue;
            db.Settings.Add(new AppSetting { Key = key, Value = value });
            added = true;
        }
        if (added) await db.SaveChangesAsync();
    }

    /// <summary>Günün Sohbeti yazıları + Günün Menüsü (virgülle ayrılmış yemekler).</summary>
    private static void AddSohbetVeMenuItems(AppDbContext db, ContentCategory sohbet, ContentCategory menu)
    {
        void S(string title, string body, int? m = null, int? d = null) =>
            db.ContentItems.Add(new ContentItem
            {
                Category = sohbet, Title = title, Body = body,
                PinnedMonth = m, PinnedDay = d, CreatedAtUtc = DateTime.UtcNow,
            });
        void M(string title, string dishes) =>
            db.ContentItems.Add(new ContentItem
            {
                Category = menu, Title = title, Body = dishes, CreatedAtUtc = DateTime.UtcNow,
            });

        S("İnsanlar Eşittir",
            "Allah'ın huzurunda ırkı, rengi, dili ya da cinsiyeti fark etmeksizin herkes eşittir. İnsanlık; hayatta ve ölümde, haklarda ve borçlarda, kanun önünde ve vicdanda eşitlenmiştir. Hiçbir vasıf, bir insanı diğerlerinin önüne geçirebilecek güçte değildir.");
        S("Şükürle Kapanan Yıl",
            "Bir yılı geride bırakırken kazanılan en büyük servet, geçen günlerin kıymetini bilmektir. İnsan, elindekinin değerini çoğu zaman onu yitirdiğinde anlar. Bugün; sağlığa, ekmeğe ve sevdiklerimize sahip olmanın şükrünü hatırlama günüdür.", 12, 31);
        S("Komşuluk Hakkı",
            "Eskiler, kapısı çalınmadan halini soran komşuyu en büyük zenginlik sayardı. Mahallenin huzuru, paylaşılan bir tabak yemekte, hatırlanan bir selamda saklıdır.");
        S("Sözün Değeri",
            "Söz, ağızdan çıkana kadar insanın esiridir; çıktıktan sonra insan sözünün esiri olur. Az ve öz konuşmak, hem dinleyene hem söyleyene saygıdır.");
        S("Misafir Bereketi",
            "Anadolu'da kapı çalındığında sofraya bir tabak daha konur. Misafir, bereketiyle gelir; ev sahibine düşen, güler yüzle karşılamaktır.");

        M("Kış Sofrası", "Mercimek çorbası, Etli kuru fasulye, Bulgur pilavı, Turşu");
        M("Klasik Sofra", "Tarhana çorbası, Tas kebabı, Pirinç pilavı, Çoban salata");
        M("Cuma Sofrası", "Yayla çorbası, Etli nohut, Tereyağlı pilav, Cacık");
        M("Ege Sofrası", "Ezogelin çorbası, Zeytinyağlı enginar, Şehriyeli pilav, Mevsim salata");
        M("Anadolu Sofrası", "Düğün çorbası, Karnıyarık, Bulgur pilavı, Ayran");
        M("Deniz Sofrası", "Balık çorbası, Fırında levrek, Roka salatası, Cevizli baklava");
    }

    /// <summary>Veri kümesi içe aktarma sonucu: toplam, zaten var olan, yeni eklenen.</summary>
    public sealed record ImportResult(int DatasetTotal, int AlreadyPresent, int Added);

    private sealed record QuoteSeed(string Text, string? Author);

    /// <summary>
    /// "Günün sözü" verisini Data/Seed/quotes.json dosyasından idempotent yükler.
    /// Yalnızca Quotes tablosu boşken ekler; metne göre tekilleştirir. Dosya
    /// okunamaz/ayrıştırılamazsa küçük bir gömülü liste devreye girer.
    /// </summary>
    private static void SeedQuotes(AppDbContext db)
    {
        // Tablo boş değilse dokunma (idempotentlik koruması).
        if (db.Quotes.Local.Count > 0 || db.Quotes.Any()) return;

        db.Quotes.AddRange(BuildQuotesToInsert(LoadQuotesFromFile() ?? FallbackQuotes(), existingTexts: null));
    }

    /// <summary>
    /// Gömülü söz veri kümesini ALREADY-POPULATED veritabanına yıkıcı olmadan
    /// (yalnızca eksikleri ekleyerek) içe aktarır. Metne göre büyük/küçük harf
    /// duyarsız tekilleştirilir; mevcut kayıtlar değiştirilmez/silinmez.
    /// </summary>
    public static async Task<ImportResult> ImportQuotesAsync(AppDbContext db, CancellationToken ct = default)
    {
        var dataset = LoadQuotesFromFile() ?? FallbackQuotes();

        var existing = new HashSet<string>(
            await db.Quotes.Select(q => q.Text).ToListAsync(ct),
            StringComparer.OrdinalIgnoreCase);

        var (datasetTotal, toInsert) = CountAndBuildQuotes(dataset, existing);
        if (toInsert.Count > 0)
        {
            db.Quotes.AddRange(toInsert);
            await db.SaveChangesAsync(ct);
        }
        return new ImportResult(datasetTotal, datasetTotal - toInsert.Count, toInsert.Count);
    }

    /// <summary>
    /// Veri kümesindeki geçerli (boş olmayan, kendi içinde tekil) sözleri sayar ve
    /// <paramref name="existingTexts"/> içinde olmayanlardan eklenecek Quote listesi üretir.
    /// </summary>
    private static (int DatasetTotal, List<Quote> ToInsert) CountAndBuildQuotes(
        List<QuoteSeed> dataset, HashSet<string> existingTexts)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var toInsert = new List<Quote>();
        var datasetTotal = 0;
        foreach (var q in dataset)
        {
            var text = q.Text?.Trim();
            if (string.IsNullOrWhiteSpace(text)) continue;
            if (!seen.Add(text)) continue; // veri kümesi içinde tekilleştir
            datasetTotal++;
            if (existingTexts.Contains(text)) continue; // mevcutsa atla (additive)

            var author = string.IsNullOrWhiteSpace(q.Author) ? null : q.Author.Trim();
            toInsert.Add(new Quote { Text = text, Author = author });
        }
        return (datasetTotal, toInsert);
    }

    /// <summary>Boş-DB seed yolu için: tüm geçerli/tekil sözleri Quote listesine dönüştürür.</summary>
    private static List<Quote> BuildQuotesToInsert(List<QuoteSeed> dataset, HashSet<string>? existingTexts)
        => CountAndBuildQuotes(dataset, existingTexts ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase)).ToInsert;

    private static List<QuoteSeed>? LoadQuotesFromFile()
    {
        try
        {
            var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "quotes.json");
            if (!File.Exists(path)) return null;

            var json = File.ReadAllText(path);
            var quotes = JsonSerializer.Deserialize<List<QuoteSeed>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            });

            return quotes is { Count: > 0 } ? quotes : null;
        }
        catch
        {
            // Bozuk/okunamayan dosyada sessizce gömülü listeye düş.
            return null;
        }
    }

    /// <summary>Dosya yüklenemezse kullanılan asgari gömülü liste (atasözleri).</summary>
    private static List<QuoteSeed> FallbackQuotes() =>
    [
        new("Damlaya damlaya göl olur.", "Atasözü"),
        new("Sabır acıdır, meyvesi tatlıdır.", "Atasözü"),
        new("Bilmemek ayıp değil, öğrenmemek ayıptır.", "Atasözü"),
        new("Ne ekersen onu biçersin.", "Atasözü"),
        new("Tatlı dil yılanı deliğinden çıkarır.", "Atasözü"),
        new("Hayatta en hakiki mürşit ilimdir.", "Mustafa Kemal Atatürk"),
        new("Sevelim, sevilelim; bu dünya kimseye kalmaz.", "Yunus Emre"),
        new("Bilgi paylaşıldıkça çoğalan tek hazinedir.", null),
    ];

    private sealed record NameSeed(string Name, string Gender, string? Meaning);

    /// <summary>
    /// Bebek isimlerini Data/Seed/baby-names.json dosyasından idempotent yükler.
    /// Yalnızca BabyNames tablosu boşken ekler; (Ad, Cinsiyet) çiftine göre
    /// tekilleştirir. Cinsiyet yalnızca "K" veya "E" olabilir; geçersiz/eksik
    /// kayıtlar atlanır. Dosya okunamaz/ayrıştırılamazsa küçük bir gömülü liste
    /// devreye girer.
    /// </summary>
    private static void SeedNames(AppDbContext db)
    {
        // Tablo boş değilse dokunma (idempotentlik koruması).
        if (db.BabyNames.Local.Count > 0 || db.BabyNames.Any()) return;

        db.BabyNames.AddRange(BuildNamesToInsert(LoadNamesFromFile() ?? FallbackNames(), existingKeys: null));
    }

    /// <summary>
    /// Gömülü bebek ismi veri kümesini ALREADY-POPULATED veritabanına yıkıcı olmadan
    /// (yalnızca eksikleri ekleyerek) içe aktarır. (Ad, Cinsiyet) çiftine göre
    /// büyük/küçük harf duyarsız tekilleştirilir; mevcut kayıtlar değiştirilmez/silinmez.
    /// </summary>
    public static async Task<ImportResult> ImportNamesAsync(AppDbContext db, CancellationToken ct = default)
    {
        var dataset = LoadNamesFromFile() ?? FallbackNames();

        var existing = new HashSet<(string, string)>(
            (await db.BabyNames.Select(n => new { n.Name, n.Gender }).ToListAsync(ct))
                .Select(n => (n.Name.Trim().ToLowerInvariant(), n.Gender.Trim().ToUpperInvariant())));

        var (datasetTotal, toInsert) = CountAndBuildNames(dataset, existing);
        if (toInsert.Count > 0)
        {
            db.BabyNames.AddRange(toInsert);
            await db.SaveChangesAsync(ct);
        }
        return new ImportResult(datasetTotal, datasetTotal - toInsert.Count, toInsert.Count);
    }

    /// <summary>
    /// Veri kümesindeki geçerli (Ad dolu, Cinsiyet K/E, kendi içinde tekil) isimleri sayar ve
    /// <paramref name="existingKeys"/> içinde (ad-küçük, cinsiyet-büyük) olmayanlardan eklenecek liste üretir.
    /// </summary>
    private static (int DatasetTotal, List<BabyName> ToInsert) CountAndBuildNames(
        List<NameSeed> dataset, HashSet<(string, string)> existingKeys)
    {
        var seen = new HashSet<(string, string)>();
        var toInsert = new List<BabyName>();
        var datasetTotal = 0;
        foreach (var n in dataset)
        {
            var name = n.Name?.Trim();
            var gender = n.Gender?.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(name)) continue;
            if (gender != "K" && gender != "E") continue;            // yalnızca K/E
            if (!seen.Add((name.ToLowerInvariant(), gender))) continue; // veri kümesi içinde tekilleştir
            datasetTotal++;
            if (existingKeys.Contains((name.ToLowerInvariant(), gender))) continue; // mevcutsa atla (additive)

            var meaning = string.IsNullOrWhiteSpace(n.Meaning) ? null : n.Meaning.Trim();
            toInsert.Add(new BabyName { Name = name, Gender = gender, Meaning = meaning });
        }
        return (datasetTotal, toInsert);
    }

    /// <summary>Boş-DB seed yolu için: tüm geçerli/tekil isimleri BabyName listesine dönüştürür.</summary>
    private static List<BabyName> BuildNamesToInsert(List<NameSeed> dataset, HashSet<(string, string)>? existingKeys)
        => CountAndBuildNames(dataset, existingKeys ?? new HashSet<(string, string)>()).ToInsert;

    private static List<NameSeed>? LoadNamesFromFile()
    {
        try
        {
            var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "baby-names.json");
            if (!File.Exists(path)) return null;

            var json = File.ReadAllText(path);
            var names = JsonSerializer.Deserialize<List<NameSeed>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            });

            return names is { Count: > 0 } ? names : null;
        }
        catch
        {
            // Bozuk/okunamayan dosyada sessizce gömülü listeye düş.
            return null;
        }
    }

    /// <summary>Dosya yüklenemezse kullanılan asgari gömülü liste.</summary>
    private static List<NameSeed> FallbackNames() =>
    [
        new("Elif", "K", "Arap alfabesinin ilk harfi; ince, narin"),
        new("Defne", "K", "Yaprağını dökmeyen güzel kokulu ağaç"),
        new("Zeynep", "K", "Değerli, güzel kokulu bir ağaç"),
        new("Duru", "K", "Saf, berrak"),
        new("Nehir", "K", "Irmak, akarsu"),
        new("Yusuf", "E", "Allah kat kat artırsın; bir peygamber adı"),
        new("Yiğit", "E", "Cesur, kahraman, yürekli"),
        new("Emir", "E", "Bey, komutan; buyruk veren"),
        new("Demir", "E", "Güçlü, sağlam, dayanıklı"),
        new("Çınar", "E", "Uzun ömürlü, ulu ağaç"),
    ];
}
