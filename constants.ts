
import { RoughnessMaterial, RunoffSurface } from './types';

export const MANNING_ROUGHNESS: RoughnessMaterial[] = [
  { name: 'Beton Halus (Finishing Sendok)', value: 0.013, category: 'Buatan' },
  { name: 'Beton Kasar', value: 0.015, category: 'Buatan' },
  { name: 'Pasangan Batu Kali (Semen)', value: 0.025, category: 'Buatan' },
  { name: 'Saluran Tanah Bersih', value: 0.022, category: 'Alami' },
  { name: 'Saluran Tanah Berkerikil', value: 0.030, category: 'Alami' },
  { name: 'Saluran Alami Berumput', value: 0.035, category: 'Alami' },
  { name: 'Sungai Alami Berliku', value: 0.045, category: 'Alami' },
];

export const RUNOFF_COEFFICIENTS: RunoffSurface[] = [
  { name: 'Perkotaan (Pusat Bisnis)', value: 0.85, category: 'Perkotaan' },
  { name: 'Pemukiman Padat', value: 0.70, category: 'Perkotaan' },
  { name: 'Pemukiman Renggang', value: 0.50, category: 'Perkotaan' },
  { name: 'Taman / Ruang Terbuka', value: 0.15, category: 'Perkotaan' },
  { name: 'Hutan Lebat', value: 0.15, category: 'Rural' },
  { name: 'Lahan Pertanian', value: 0.30, category: 'Rural' },
  { name: 'Tanah Terbuka / Gundul', value: 0.60, category: 'Rural' },
];

// Database Wilayah Jawa Barat (27 Kota/Kabupaten)
// Mencakup Kecamatan Utama dan Kelurahan/Desa representatif
export const WEST_JAVA_LOCATIONS: Record<string, Record<string, string[]>> = {
  // =========================================
  // KOTA (9 Daerah)
  // =========================================
  "Kota Bandung": {
    "Andir": ["Campaka", "Ciroyom", "Dunguscariang", "Garuda", "Kebonjeruk", "Maleber"],
    "Astana Anyar": ["Cibadak", "Karanganyar", "Karasak", "Nyengseret", "Panjunan", "Pelindung Hewan"],
    "Antapani": ["Antapani Kidul", "Antapani Kulon", "Antapani Tengah", "Antapani Wetan"],
    "Arcamanik": ["Cisaranten Bina Harapan", "Cisaranten Endah", "Cisaranten Kulon", "Sukamiskin"],
    "Babakan Ciparay": ["Babakan", "Babakan Ciparay", "Cirangrang", "Margahayu Utara", "Margasuka", "Sukahaji"],
    "Bandung Kidul": ["Batununggal", "Kujangsari", "Mengger", "Wates"],
    "Bandung Kulon": ["Caringin", "Cijerah", "Cigondewah Kaler", "Cigondewah Kidul", "Cigondewah Rahayu", "Gempolsari", "Warungmuncang"],
    "Bandung Wetan": ["Cihapit", "Citarum", "Tamansari"],
    "Batununggal": ["Binong", "Cibangkong", "Gumuruh", "Kacapiring", "Kebongedang", "Kebonwaru", "Maleer", "Samoja"],
    "Bojongloa Kaler": ["Babakan Asih", "Babakan Tarogong", "Jamika", "Kopo", "Suka Asih"],
    "Bojongloa Kidul": ["Cibaduyut", "Cibaduyut Kidul", "Cibaduyut Wetan", "Kebon Lega", "Mekarwangi", "Situsaeur"],
    "Buahbatu": ["Cijawura", "Jatisari", "Margasari", "Sekejati"],
    "Cibeunying Kaler": ["Cigadung", "Cihaur Geulis", "Neglasari", "Sukaluyu"],
    "Cibeunying Kidul": ["Cicadas", "Cikutra", "Padasuka", "Pasirlayung", "Sukapada", "Sukamaju"],
    "Cibiru": ["Cipadung", "Cipadung Kidul", "Cipadung Kulon", "Cipadung Wetan", "Cisurupan", "Palasari", "Pasirbiru"],
    "Cicendo": ["Arjuna", "Husenseastranegara", "Pajajaran", "Pamoyanan", "Pasirkaliki", "Sukaraja"],
    "Cidadap": ["Ciumbuleuit", "Hegarmanah", "Ledeng"],
    "Cinambo": ["Babakan Penghulu", "Cisaranten Wetan", "Pakemitan", "Sukamulya"],
    "Coblong": ["Cipaganti", "Dago", "Lebak Gede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"],
    "Gedebage": ["Cimincrang", "Cisaranten Kidul", "Rancabolang", "Rancanumpang"],
    "Kiaracondong": ["Babakan Sari", "Babakan Surabaya", "Cicaheum", "Kebonjayanti", "Kebonkangkung", "Sukapura"],
    "Lengkong": ["Burangrang", "Cijagra", "Cikawao", "Lingkar Selatan", "Malabar", "Paledang", "Turangga"],
    "Mandalajati": ["Jatihandap", "Karangpamulang", "Pasir Impun", "Sindangjaya"],
    "Panyileukan": ["Cipadung Kidul", "Cipadung Kulon", "Mekar Mulya", "Panghegar"],
    "Rancasari": ["Cipamokolan", "Darwati", "Manjahlega", "Mekar Jaya"],
    "Regol": ["Ancol", "Balonggede", "Ciateul", "Ciseureuh", "Pasirlouyu", "Pungkur"],
    "Sukajadi": ["Cipedes", "Pasteur", "Sukabungah", "Sukagalih", "Sukawarna"],
    "Sukasari": ["Gegerkalong", "Isola", "Sarijadi", "Sukarasa"],
    "Sumur Bandung": ["Babakan Ciamis", "Braga", "Kebon Pisang", "Merdeka"],
    "Ujung Berung": ["Cigending", "Pasir Endah", "Pasir Jati", "Pasir Wangi", "Ujung Berung"]
  },
  "Kota Bekasi": {
    "Bantar Gebang": ["Bantargebang", "Ciketing Udik", "Cikiwul", "Sumur Batu"],
    "Bekasi Barat": ["Bintara", "Bintara Jaya", "Jakasampurna", "Kota Baru", "Kranji"],
    "Bekasi Selatan": ["Jaka Mulya", "Jaka Setia", "Kayuringin Jaya", "Marga Jaya", "Pekayon Jaya"],
    "Bekasi Timur": ["Aren Jaya", "Bekasi Jaya", "Duren Jaya", "Margahayu"],
    "Bekasi Utara": ["Harapan Baru", "Harapan Jaya", "Kaliabang Tengah", "Marga Mulya", "Perwira", "Teluk Pucung"],
    "Jatiasih": ["Jatiasih", "Jatikramat", "Jatiluhur", "Jatimekar", "Jatirasa", "Jatisari"],
    "Jatisampurna": ["Jatikarya", "Jatiraden", "Jatirangga", "Jatiranggon", "Jatisampurna"],
    "Medan Satria": ["Harapan Mulya", "Kali Baru", "Medan Satria", "Pejuang"],
    "Mustika Jaya": ["Cimuning", "Mustikajaya", "Mustikasari", "Padurenan"],
    "Pondok Gede": ["Jatibening", "Jatibening Baru", "Jaticempaka", "Jatimakmur", "Jatiwaringin"],
    "Pondok Melati": ["Jatimelati", "Jatimurni", "Jatirahayu", "Jatiwarna"],
    "Rawalumbu": ["Bojong Menteng", "Bojong Rawalumbu", "Pengasinan", "Sepanjang Jaya"]
  },
  "Kota Bogor": {
    "Bogor Barat": ["Balungbangjaya", "Bubulak", "Cilendek Barat", "Cilendek Timur", "Curug", "Curugmekar", "Gunungbatu", "Loji", "Margajaya", "Menteng", "Pasirjaya", "Pasirkuda", "Pasirmulya", "Semplak", "Sindangbarang", "Situgede"],
    "Bogor Selatan": ["Batutulis", "Bojongkerta", "Bondongan", "Cikaret", "Cipaku", "Empang", "Genteng", "Harjasari", "Kertamaya", "Lawanggintung", "Muarasari", "Mulyaharja", "Pakuan", "Pamoyanan", "Rancamaya", "Ranggamekar"],
    "Bogor Tengah": ["Babakan", "Babakanpasar", "Cibogor", "Ciweuringin", "Gudang", "Kebonkelapa", "Pabaton", "Paledang", "Panaragan", "Sempur", "Tegallega"],
    "Bogor Timur": ["Baranangsiang", "Katulampa", "Sindangrasa", "Sindangsari", "Sukasari", "Tajur"],
    "Bogor Utara": ["Bantarjati", "Cibuluh", "Ciluar", "Cimahpar", "Ciparigi", "Kedunghalang", "Tanahbaru", "Tegal Gundil"],
    "Tanah Sareal": ["Cibadak", "Kayumanis", "Kebonpedes", "Kedungbadak", "Kedungjaya", "Kedungwaringin", "Kencana", "Mekarwangi", "Sukadamai", "Sukaresmi", "Tanahsareal"]
  },
  "Kota Depok": {
    "Beji": ["Beji", "Beji Timur", "Kemiri Muka", "Kukusan", "Pondok Cina", "Tanah Baru"],
    "Bojongsari": ["Bojongsari Baru", "Bojongsari Lama", "Curug", "Duren Mekar", "Duren Seribu", "Pondok Petir", "Serua"],
    "Cilodong": ["Cilodong", "Jatimulya", "Kalibaru", "Kalimulya", "Sukamaju"],
    "Cimanggis": ["Cisalak Pasar", "Curug", "Harjamukti", "Mekarsari", "Pasir Gunung Selatan", "Tugu"],
    "Cinere": ["Cinere", "Gandul", "Pangkalan Jati", "Pangkalan Jati Baru"],
    "Cipayung": ["Bojong Pondok Terong", "Cipayung", "Cipayung Jaya", "Pondok Jaya", "Ratujaya"],
    "Limo": ["Grogol", "Krukut", "Limo", "Meruyung"],
    "Pancoran Mas": ["Depok", "Depok Jaya", "Mampang", "Pancoran Mas", "Rangkapan Jaya", "Rangkapan Jaya Baru"],
    "Sawangan": ["Bedahan", "Cinangka", "Kedaung", "Pasir Putih", "Pengasinan", "Sawangan Baru", "Sawangan Lama"],
    "Sukmajaya": ["Abadijaya", "Baktijaya", "Cisalak", "Mekar Jaya", "Sukmajaya", "Tirtajaya"],
    "Tapos": ["Cilangkap", "Cimpaeun", "Jatijajar", "Leuwinanggung", "Sukatani", "Sukamaju Baru", "Tapos"]
  },
  "Kota Cimahi": {
    "Cimahi Selatan": ["Cibeber", "Cibeureum", "Leuwigajah", "Melong", "Utama"],
    "Cimahi Tengah": ["Baros", "Cigugur Tengah", "Karangmekar", "Padasuka", "Setiamanah", "Cimahi"],
    "Cimahi Utara": ["Cibabat", "Cipageran", "Citeureup", "Pasirkaliki"]
  },
  "Kota Cirebon": {
    "Harjamukti": ["Arcasari", "Harjamukti", "Kalijaga", "Kecapi", "Larangan"],
    "Kejaksan": ["Kebonbaru", "Kejaksan", "Kesenden", "Sukapura"],
    "Kesambi": ["Drajat", "Karyamulya", "Kesambi", "Pekiringan", "Sunyaragi"],
    "Lemahwungkuk": ["Kasepuhan", "Lemahwungkuk", "Panjunan", "Pegambiran"],
    "Pekalipan": ["Jagasatru", "Pekalipan", "Pekalangan", "Pulasaren"]
  },
  "Kota Sukabumi": {
    "Baros": ["Baros", "Jayaraksa", "Jayamekar", "Sudajaya Hilir"],
    "Cibeureum": ["Babakan", "Cibeureumhilir", "Limusnunggal", "Sindangpalay"],
    "Cikole": ["Cikole", "Gunungparang", "Kebonjati", "Selabatu", "Subangjaya"],
    "Citamiang": ["Citamiang", "Gedongpanjang", "Nanggeleng", "Tipar"],
    "Gunungpuyuh": ["Gunungpuyuh", "Karamat", "Sriwidari"],
    "Lembursitu": ["Cikundul", "Cipanengah", "Lembursitu", "Situmekar"],
    "Warudoyong": ["Benteng", "Dayeuhluhur", "Nyomplong", "Sukakarya", "Warudoyong"]
  },
  "Kota Tasikmalaya": {
    "Bungursari": ["Bantarsari", "Bungursari", "Cibunigeulis", "Sukajaya"],
    "Cibeureum": ["Awipari", "Ciakar", "Ciherang", "Kotabaru"],
    "Cihideung": ["Argasari", "Cilembang", "Nagarawangi", "Tugujaya"],
    "Cipedes": ["Cipedes", "Nagarasari", "Panglayungan", "Sukamanah"],
    "Indihiang": ["Indihiang", "Panyingkiran", "Parakannyasag", "Sirnagalih"],
    "Kawalu": ["Cibeuti", "Cilamajang", "Gununggede", "Gunungtandala"],
    "Mangkubumi": ["Cigantang", "Cipari", "Cipawitra", "Mangkubumi"],
    "Purbaratu": ["Purbaratu", "Sukaasih", "Sukajaya", "Sukamenak"],
    "Tamansari": ["Mugarsari", "Mulyasari", "Setiamulya", "Tamansari"],
    "Tawang": ["Cikalang", "Empangsari", "Kahuripan", "Lengkongsari", "Tawangsari"]
  },
  "Kota Banjar": {
    "Banjar": ["Balokang", "Banjar", "Jazuli", "Mekarsari", "Neglasari"],
    "Langensari": ["Bojongkantong", "Kujangsari", "Langensari", "Muktisari", "Rejasari"],
    "Pataruman": ["Batulawang", "Binangun", "Hegarsari", "Karyamukti", "Mulyasari", "Pataruman"],
    "Purwaharja": ["Karangpanimbal", "Mekarharja", "Purwaharja", "Raharja"]
  },

  // =========================================
  // KABUPATEN (18 Daerah)
  // =========================================
  "Kab. Bandung": {
    "Soreang": ["Soreang", "Panyirapan", "Karamatmulya", "Sukanagara", "Sukajadi", "Sekarwangi"],
    "Baleendah": ["Andir", "Baleendah", "Jelekong", "Malakasari", "Rancamanyar", "Wargamekar"],
    "Banjaran": ["Banjaran", "Banjaran Wetan", "Ciapus", "Kamasan", "Kiangroke", "Margahurip", "Sindangpanon"],
    "Bojongsoang": ["Bojongsari", "Bojongsoang", "Buahbatu", "Cipagalo", "Lengkong", "Tegalluar"],
    "Cileunyi": ["Cibiru Hilir", "Cibiru Wetan", "Cileunyi Kulon", "Cileunyi Wetan", "Cinunuk"],
    "Cicalengka": ["Babakan Peuteuy", "Cicalengka Kulon", "Cicalengka Wetan", "Cikuya", "Dampit", "Margaasih", "Nagrog", "Panenjoan", "Tanjungwangi", "Tenjolaya", "Waluya"],
    "Cikancung": ["Cihanyir", "Cikancung", "Cikasungka", "Ciluluk", "Hegarnagar", "Mandaralas", "Mekarlaksana", "Srirahayu", "Tanjunglaya"],
    "Cimenyan": ["Cibeunying", "Ciburial", "Cikadut", "Cimenyan", "Mandalamekar", "Mekarmanik", "Mekarsaluyu", "Padasuka", "Sindanglaya"],
    "Ciparay": ["Babakan", "Bumiwangi", "Ciheulang", "Cikoneng", "Ciparay", "Gunungleutik", "Manggungharja", "Mekarsari", "Pakutandang", "Sagaracipta", "Sarimahi", "Serangmekar", "Sumbersari"],
    "Ciwidey": ["Ciwidey", "Lebakmuncang", "Nengkelan", "Panundaan", "Panyocokan", "Rawabogo", "Sukawening"],
    "Dayeuhkolot": ["Cangkuang Kulon", "Cangkuang Wetan", "Citeureup", "Dayeuhkolot", "Pasawahan", "Sukapura"],
    "Ibun": ["Cibeet", "Dukuh", "Ibun", "Karyalaksana", "Laksana", "Lampegan", "Mekarwangi", "Neglasari", "Pangguh", "Sudi", "Talun", "Tanggulun"],
    "Katapang": ["Banyusari", "Cilampeni", "Gandasari", "Katapang", "Pangauban", "Sangkanhurip", "Sukamukti"],
    "Kertasari": ["Cibeureum", "Cihawuk", "Cikembang", "Neglawangi", "Resmitingal", "Santosa", "Sukapura", "Tarumajaya"],
    "Kutawaringin": ["Buninagara", "Cibodas", "Cilame", "Gajahmekar", "Jatisari", "Jelegong", "Kopo", "Kutawaringin", "Padasuka", "Pameuntasan", "Sukamulya"],
    "Majalaya": ["Biru", "Bojong", "Majalaya", "Majakerta", "Majasetra", "Neglasari", "Padamulya", "Padaulun", "Sukamaju", "Suksaluyu", "Wangisagara"],
    "Margaasih": ["Cigondewah Hilir", "Lagadar", "Margaasih", "Mekar Rahayu", "Nanjung", "Rahayu"],
    "Margahayu": ["Margahayu Selatan", "Margahayu Tengah", "Sayati", "Sukamenak", "Sulaeman"],
    "Nagreg": ["Bojong", "Ciherang", "Citaman", "Ganjarsabar", "Mandalawangi", "Nagreg", "Nagreg Kendan"],
    "Pacet": ["Cikawao", "Cikitu", "Cinanggela", "Cipeujeuh", "Girimulya", "Mandalahaji", "Maruyung", "Mekarsari", "Nagrak", "Pangauban", "Sukarame", "Tanjungwangi"],
    "Pameungpeuk": ["Bojongkunci", "Bojongmanggu", "Langonsari", "Rancamulya", "Rancatungku", "Sukasari"],
    "Pangalengan": ["Banjarsari", "Lamajang", "Margaluyu", "Margamekar", "Margamukti", "Margamulya", "Pangalengan", "Pulosari", "Sukaluyu", "Sukamanah", "Tribaktimulya", "Wanasuka", "Warnasari"],
    "Paseh": ["Cijagra", "Cipaku", "Cipedes", "Drawati", "Karangtunggal", "Loa", "Mekarpawitan", "Sindangsari", "Sukamanah", "Sukamantri", "Tangsimekar"],
    "Pasirjambu": ["Cibodas", "Cikoneng", "Cisondari", "Cukanggenteng", "Margamulya", "Mekarmaju", "Mekarsari", "Pasirjambu", "Sugihmukti", "Tenjolaya"],
    "Rancabali": ["Alamendah", "Cipelah", "Indragiri", "Patengan", "Sukaresmi"],
    "Rancaekek": ["Bojongloa", "Bojongsalam", "Cangkuang", "Haurpugur", "Jelegong", "Linggar", "Nanjungmekar", "Rancaekek Kulon", "Rancaekek Wetan", "Sangiang", "Sukamanah", "Sukamulya", "Tegalluar"],
    "Solokanjeruk": ["Bojongemas", "Cibodas", "Langensari", "Padamukti", "Panyadap", "Rancakasumba", "Solokanjeruk"]
  },
  "Kab. Bandung Barat": {
    "Lembang": ["Cikahuripan", "Cikidang", "Cibogo", "Cikole", "Gudangkahuripan", "Jayagiri", "Kayuambon", "Lembang", "Mekarwangi"],
    "Padalarang": ["Cempakamekar", "Ciburuy", "Cimerang", "Cipeundeuy", "Jayamemekar", "Kertajaya", "Kertamulya", "Laksanamekar", "Padalarang", "Tagogapu"],
    "Ngamprah": ["Bojongkoneng", "Cilame", "Cimanggu", "Cimareme", "Gadobangkong", "Margajaya", "Mekarsari", "Ngamprah", "Pakuhaji", "Sukatani", "Tanimulya"],
    "Parongpong": ["Cigugur Girang", "Cihanjuang", "Cihanjuang Rahayu", "Cihideung", "Ciwaruga", "Karyawangi", "Sariwangi"],
    "Cisarua": ["Cipada", "Jambudipa", "Kertawangi", "Padaasih", "Pasirhalang", "Pasirlangu", "Sadangmekar", "Tugumukti"],
    "Batujajar": ["Batujajar Barat", "Batujajar Timur", "Cangkorah", "Galanggang", "Giri Asih", "Pangauban", "Selacau"],
    "Cihampelas": ["Cihampelas", "Cipatik", "Citapen", "Mekarjeaya", "Pataruman", "Singajaya", "Tanjungjaya"],
    "Cikalongwetan": ["Cikalong", "Cipada", "Ciptagumati", "Cisomang Barat", "Ganjarsari", "Kanangasari", "Mandalamukti", "Mandalasari", "Mekarwangi", "Puturan", "Rende", "Tenjolaut", "Wangunjaya"],
    "Cililin": ["Batulayang", "Bongas", "Budiharja", "Cililin", "Karanganyar", "Karangtanjung", "Karyamukti", "Kidangpananjung", "Mukapayung", "Nangeleng", "Rancapanggung"],
    "Cipatat": ["Ciptaharja", "Cirawa Mekar", "Citatah", "Gunungmasigit", "Kertamukti", "Mandalawangi", "Nyalindung", "Rajamandala Kulon", "Sarimukti", "Sumurbandung"],
    "Cipeundeuy": ["Ciharashas", "Cipeundeuy", "Ciroyom", "Jatimekar", "Margalaksana", "Nanggeleng", "Nyenang", "Sirnagalih", "Sirnaraja", "Sukahaji"],
    "Gununghalu": ["Bunijaya", "Celak", "Cilangari", "Gununghalu", "Sindangjaya", "Sirnajaya", "Sukaaswi", "Tamanjaya", "Wargasaluyu"],
    "Rongga": ["Bojong", "Boijongsalam", "Cibedug", "Cibitung", "Cicadas", "Cinengah", "Sukamanah", "Sukaresmi"],
    "Saguling": ["Bojongheulang", "Cikande", "Cipangeran", "Girimukti", "Jati", "Saguling"]
  },
  "Kab. Bekasi": {
    "Babelan": ["Babelan Kota", "Bahagia", "Buni Bakti", "Hurip Jaya", "Kebalen", "Kedung Jaya", "Kedung Pengawas", "Muara Bakti", "Pantai Hurip"],
    "Cikarang Pusat": ["Cicau", "Hegarmukti", "Jayamukti", "Pasirranji", "Pasirtanjung", "Sukamahi"],
    "Cikarang Barat": ["Cikedokan", "Danauindah", "Gandamekar", "Gandasari", "Jatiwangi", "Kalijaya", "Mekarwangi", "Sukadanau", "Telaga Asih", "Telagamurni", "Telajung"],
    "Cikarang Selatan": ["Ciantra", "Cibatu", "Pasirsari", "Serang", "Sukadami", "Sukaresmi", "Sukasejati"],
    "Cikarang Timur": ["Cipayung", "Hegarmanah", "Jatibaru", "Jatireja", "Karangsari", "Labansari", "Sertajaya", "Tanjungbaru"],
    "Cikarang Utara": ["Cikarang Kota", "Harjamekar", "Karangasih", "Karangbaru", "Karangraharja", "Mekarmukti", "Pasirgombong", "Simpangan", "Tanjungsari", "Waluya", "Wangunharja"],
    "Cibitung": ["Cibuntu", "Kertamukti", "Muktiwari", "Sarimukti", "Sukajaya", "Wanajaya", "Wanasari"],
    "Tambun Selatan": ["Jatimulya", "Lambangjaya", "Lambangsari", "Mangunjaya", "Mekarsari", "Setiadarma", "Setiamekar", "Sumberjaya", "Tambun", "Tridaya Sakti"],
    "Tambun Utara": ["Jalenjaya", "Karangsatria", "Satria Jaya", "Satria Mekar", "Sriamur", "Srimahi", "Srimukti", "Srijaya"],
    "Tarumajaya": ["Pahlawan Setia", "Pantai Makmur", "Pusaka Rakyat", "Samudra Jaya", "Segara Jaya", "Segara Makmur", "Setia Asih", "Setia Mulya"],
    "Setu": ["Burangkeng", "Cibening", "Cijengkol", "Cikarageman", "Ciledug", "Kertarahayu", "Lubangbuaya", "Muktijaya", "Ragamanunggal", "Taman Rahayu", "Taman Sari"],
    "Serang Baru": ["Cylangkara", "Jayasampurna", "Jayamulya", "Nagacipta", "Nagawijaya", "Sirnajaya", "Sukaragam", "Sukasari"],
    "Cibarusah": ["Cibarusahjaya", "Cibarusahkota", "Ridogalih", "Ridomanah", "Sindangmulya", "Sirnajati", "Wibawamulya"],
    "Bojongmangu": ["Bojongmangu", "Karangindah", "Karangmulya", "Medalkrisna", "Sukabungah", "Sukamukti"]
  },
  "Kab. Bogor": {
    "Cibinong": ["Cibinong", "Cirimekar", "Ciriung", "Harapan Jaya", "Karang Asem Barat", "Karang Asem Timur", "Nanggewer", "Nanggewer Mekar", "Pabuaran", "Pabuaran Mekar", "Pakansari", "Pondok Rajeg", "Sukahati", "Tengah"],
    "Gunung Putri": ["Bojong Kulur", "Bojong Nangka", "Ciangsana", "Cicadas", "Cikeas Udik", "Gunung Putri", "Karanggan", "Nagrak", "Tlajung Udik", "Wanaherang"],
    "Cileungsi": ["Cileungsi", "Cileungsi Kidul", "Cipeucang", "Dayeuh", "Gandoang", "Javana", "Limus Nunggal", "Mampir", "Mekar Sari", "Pasir Angin", "Setu Sari"],
    "Citeureup": ["Citeureup", "Gunung Sari", "Hambalang", "Karang Asem Timur", "Leuwinutug", "Pasir Mukti", "Puspanegara", "Puspasari", "Sanja", "Sukahati", "Tajur", "Tarikolot"],
    "Babakan Madang": ["Babakan Madang", "Bojong Koneng", "Cijayanti", "Cipambuan", "Citaringgul", "Kadumangu", "Karang Tengah", "Sentul", "Sumur Batu"],
    "Jonggol": ["Balekambang", "Bendungan", "Cibodas", "Jonggol", "Singajaya", "Singasari", "Sirnagalih", "Sukanegara", "Sukagalih", "Sukajaya", "Sukamanah", "Sukamaju", "Sukasirna", "Weninggalih"],
    "Ciawi": ["Banjar Sari", "Banjar Waru", "Bendungan", "Bitung Sari", "Bojong Murni", "Ciawi", "Cibedug", "Cileungsi", "Citapen", "Jambu Luwuk", "Pandansari", "Teluk Pinang"],
    "Cisarua": ["Batu Layang", "Cibeureum", "Cilember", "Cisarua", "Citeko", "Jogjogan", "Kopo", "Leuwimalang", "Tugu Selatan", "Tugu Utara"],
    "Megamendung": ["Cipayung Datar", "Cipayung Girang", "Gadog", "Kuta", "Megamendung", "Sukagalih", "Sukamahi", "Sukamanah", "Sukaresmi", "Suka Maju", "Suka Manah", "Suka Resmi"],
    "Parung": ["Bojong Indah", "Bojong Sempu", "Cogreg", "Iwul", "Jabon Mekar", "Pamager Sari", "Parung", "Waru", "Waru Jaya"],
    "Parung Panjang": ["Cibunar", "Gintung Cilejet", "Gorowong", "Jagatamu", "Kabajungan", "Lumpang", "Parung Panjang", "Pingku"],
    "Rumpin": ["Cipinang", "Gobang", "Kampung Sawah", "Kertajaya", "Leuwibatu", "Mekar Sari", "Rabak", "Rumpin", "Sukasari", "Taman Sari"],
    "Leuwiliang": ["Barengkok", "Cibeber I", "Cibeber II", "Karacak", "Karyasari", "Karehkel", "Leuwiliang", "Leuwimekar", "Purasari", "Puraseda"],
    "Dramaga": ["Babakan", "Ciherang", "Cikarawang", "Dramaga", "Neglasari", "Petir", "Purwasari", "Sinar Sari", "Sukadamai", "Sukawening"]
  },
  "Kab. Ciamis": {
    "Ciamis": ["Benteng", "Ciamis", "Cigembor", "Kertasari", "Linggasari", "Maleber", "Panyingkiran", "Sindangrasa"],
    "Kawali": ["Citeureup", "Karangpawitan", "Kawali", "Kawalimukti", "Linggapura", "Margamulya", "Purwasari", "Selasari", "Sindangsari", "Talagasari", "Winduraja"],
    "Panjalu": ["Bahara", "Ciomas", "Hujungtiwu", "Kertamandala", "Mandalare", "Maparah", "Panjalu", "Sandingtaman"],
    "Cijeungjing": ["Bojongmengger", "Ciharalang", "Cijeungjing", "Dewasari", "Handapherang", "Karanganyar", "Karangkamulyan", "Kertabumi", "Pamalayan", "Utama"],
    "Cikoneng": ["Cikoneng", "Cimari", "Gegempalan", "Kujang", "Margaluyu", "Nasol", "Panaragan", "Sindangsari"],
    "Rancah": ["Boijongjaya", "Cileungsir", "Cisontrol", "Dadiharja", "Jangalaharja", "Karangpari", "Kiarapayung", "Patakaharja", "Rancah", "Situmandala", "Wangunsari"]
  },
  "Kab. Cianjur": {
    "Cianjur": ["Babakan Karet", "Bojongherang", "Limbangan Sari", "Mekarsari", "Muka", "Nagrak", "Pamoyanan", "Sawah Gede", "Sayang", "Solokpandan"],
    "Cipanas": ["Batulawang", "Ciloto", "Cimacan", "Cipanas", "Palasari", "Sindangjaya", "Sindanglaya"],
    "Pacet": ["Cibodas", "Ciherang", "Cipendawa", "Ciputri", "Gadog", "Sukanagalih", "Sukani"],
    "Ciranjang": ["Cibiuk", "Ciranjang", "Gunungsari", "Karangwangi", "Kertajaya", "Mekarwangi", "Nanggalamekar", "Sindangjaya", "Sindangsari"],
    "Cibeber": ["Cibadak", "Cibeber", "Cikondang", "Cimanggu", "Cipetir", "Cisalak", "Girimulya", "Kanoman", "Karangnunggal", "Mayak", "Peuteuycondong", "Salamnunggal", "Sukamah", "Sukamaju", "Sukamanah", "Sukaraharja"],
    "Karangtengah": ["Babakan Caringin", "Bojong", "Ciherang", "Hegarmnanah", "Langensari", "Maleber", "Sabandar", "Sindangasih", "Sukamanah", "Sukantar", "Sukasarana"],
    "Sukanagara": ["Ciguha", "Gunungsari", "Jayagiri", "Sindangkerta", "Suka Karya", "Suka Laksana", "Sukamulya", "Sukanagara", "Sukaraksa", "Sukamekar"],
    "Cidaun": ["Cibuluh", "Cidamar", "Cimaragang", "Cisalak", "Gelarpawitan", "Jayapura", "Karangwangi", "Karyabakti", "Kertajadi", "Mekar Jaya", "Neglasari", "Puncakbaru", "Sukapura"]
  },
  "Kab. Cirebon": {
    "Sumber": ["Babakan", "Gegunung", "Kaliwadas", "Kemantren", "Matangaji", "Pasalakan", "Pejambon", "Perbutulan", "Sendang", "Sidawangi", "Sumber", "Tukmudal", "Watubelah"],
    "Weru": ["Karangsari", "Kertasari", "Megugede", "Megu Cilik", "Setu Kulon", "Setu Wetan", "Tegalwangi", "Weru Kidul", "Weru Lor"],
    "Plumbon": ["Bodesari", "Cempaka", "Danamulya", "Gombang", "Karangangasem", "Karangmulya", "Kebarepan", "Kedungsana", "Lurah", "Marikangen", "Pasanggrahan", "Plumbon", "Purbawinangun", "Pamijahan"],
    "Arjawinangun": ["Arjawinangun", "Bulak", "Geyongan", "Jungjang", "Jungjang Wetan", "Karangsambung", "Kebonturi", "Rawagatel", "Sende", "Tegalgubug", "Tegalgubug Lor"],
    "Gunungjati": ["Adidharma", "Astana", "Babadan", "Buyut", "Grogol", "Jadimulya", "Klayan", "Mayung", "Mertasinga", "Pasindangan", "Sambeng", "Sirnabaya", "Wanakaya"],
    "Ciledug": ["Bojongnegara", "Ciledug Kulon", "Ciledug Lor", "Ciledug Tengah", "Ciledug Wetan", "Damarguna", "Jatiseeng", "Jatiseeng Kidul", "Leuweunggajah", "Tenjomaya"]
  },
  "Kab. Garut": {
    "Garut Kota": ["Cimuncang", "Kota Kulon", "Kota Wetan", "Margawati", "Muara Sanding", "Pakuwon", "Paminggir", "Regol", "Saminggir", "Sukamentri", "Sawatam"],
    "Tarogong Kidul": ["Cibunar", "Haurpanggung", "Jayaraga", "Jayawaras", "Kersamenak", "Mekarwangi", "Pataruman", "Sukabakti", "Sukagalih", "Sukajaya", "Sukakarya", "Tarikolot"],
    "Tarogong Kaler": ["Cimanganten", "Jati", "Langensari", "Mekarjaya", "Mekasari", "Panjiwangi", "Pasawahan", "Rancabango", "Sirnajaya", "Sukajadi", "Sukawangi", "Tanjung Kamuning"],
    "Samarang": ["Cintaasih", "Cintakarya", "Cintarasa", "Cintarayat", "Cisarua", "Parakan", "Samarang", "Sirnasari", "Sukakarya", "Sukalaksana", "Sukarasa", "Tanjungkarya"],
    "Leles": ["Cangkuang", "Ciburial", "Cipancar", "Dano", "Haruman", "Jangkurang", "Kandangmukti", "Leles", "Lembang", "Margaluyu", "Salamnunggal", "Sukaryara"],
    "Kadungora": ["Cikembulan", "Cisaat", "Gandamekar", "Harumansari", "Hegarsari", "Kadungora", "Karangmulya", "Karangtengah", "Mandalasari", "Mekarbaakti", "Neglasari", "Rancasalak", "Talagasari", "Tanggulun"]
  },
  "Kab. Indramayu": {
    "Indramayu": ["Bojongsari", "Karanganyar", "Karangmalang", "Kepandean", "Lemahabang", "Lemahmekar", "Margadadi", "Paoman", "Pekandangan", "Pekandangan Jaya", "Plumbon", "Singajaya", "Singaraja", "Tambak", "Telukagung", "Terusan"],
    "Jatibarang": ["Bulak", "Bulak Lor", "Jatibarang", "Jatibarang Baru", "Jatibarang Lor", "Jatibarang Utara", "Jatisawit", "Jatisawit Lor", "Kalimati", "Kebulean", "Krasak", "Lobener", "Lobener Lor", "Malang Semirang", "Pawidean", "Pilangsari", "Sukalila"],
    "Haurgeulis": ["Cipedang", "Haurgeulis", "Haurkolot", "Karangtumaritis", "Kertanegara", "Mekarjati", "Sidadadi", "Sukajati", "Sumbermulya", "Wanakaya"],
    "Karangampel": ["Benda", "Dukuh Jeruk", "Dukuh Tengah", "Kaplongan Lor", "Karangampel", "Karangampel Kidul", "Mundu", "Pringgacala", "Sendang", "Tanjungpura", "Wanantara"],
    "Kandanghaur": ["Bulak", "Curug", "Eretan Kulon", "Eretan Wetan", "Ilir", "Karanganyar", "Karangmulya", "Kertawinangun", "Parean Girang", "Pranti", "Swan", "Wirapanjunan"]
  },
  "Kab. Karawang": {
    "Karawang Barat": ["Adiarsa Barat", "Karangpawitan", "Karangsentra", "Mekarjati", "Nagasari", "Tanjungmekar", "Tanjungpura", "Tunggakjati"],
    "Karawang Timur": ["Adiarsa Timur", "Karawang Wetan", "Kondangjaya", "Margasari", "Palumbonsari", "Plawad", "Tegalsawah", "Warungbambu"],
    "Telukjambe Timur": ["Pinayungan", "Purwadana", "Puseurjaya", "Sirnabaya", "Sukaluyu", "Sukambyu", "Telukjambe", "Wadas"],
    "Telukjambe Barat": ["Karangligar", "Karangmulya", "Margakaya", "Margamulya", "Mekarmulya", "Mulyajaya", "Parungsari", "Sukamakmur", "Wanakerta", "Wanasari"],
    "Cikampek": ["Cikampek Barat", "Cikampek Kota", "Cikampek Pusaka", "Cikampek Selatan", "Cikampek Timur", "Dawuan Barat", "Dawuan Tengah", "Dawuan Timur", "Kalihurip", "Kamojing"],
    "Klari": ["Anggadita", "Belendung", "Cibalongsari", "Curug", "Duren", "Gintungkerta", "Karanganyar", "Klari", "Kondangjaya", "Pancawati", "Sumurkondang", "Walahar"],
    "Rengasdengklok": ["Amansari", "Dewisari", "Dukuhkarya", "Karyasari", "Kertasari", "Rengasdengklok Selatan", "Rengasdengklok Utara", "Rantaupanjang"]
  },
  "Kab. Kuningan": {
    "Kuningan": ["Ancaran", "Awirarangan", "Cibinuang", "Cijoho", "Cikaso", "Cirendang", "Citangtu", "Karangtawang", "Kasturi", "Kedungarum", "Kuningan", "Padarek", "Purwawinangun", "Winduhaji", "Winduherang"],
    "Cigugur": ["Babakanmulya", "Cigadung", "Cigugur", "Cileuleuy", "Cipari", "Gunungkeling", "Puncak", "Sukamulya", "Sukaranten", "Winduherang"],
    "Cilimus": ["Bandorasa Kulon", "Bandorasa Wetan", "Bojong", "Caracas", "Cilimus", "Cibeureum", "Kaliaren", "Linggajati", "Linggaindah", "Linggamekar", "Sampora", "Setianegara"],
    "Jalaksana": ["Babakanmulya", "Ciniru", "Jalaksana", "Manis Kidul", "Manis Lor", "Nanggerang", "Padamenak", "Peusing", "Sadamantra", "Sembawa", "Sidamulya", "Sukamukti"],
    "Luragung": ["Benda", "Cikadang", "Cirahayu", "Dukuhmaja", "Dukuhpicung", "Gunungkarung", "Luragunglandeuh", "Luragungtonggoh", "Margasari", "Panyosogan", "Sindangsuka", "Wilahar"]
  },
  "Kab. Majalengka": {
    "Majalengka": ["Babakan Jawa", "Cibodas", "Cicurug", "Cijati", "Cikasarung", "Kulur", "Majalengka Kulon", "Majalengka Wetan", "Munjul", "Sindangkasih", "Tarikolot", "Tonjong"],
    "Kertajati": ["Babakan", "Bantarjati", "Kertajati", "Kertasari", "Mekarajaya", "Pasiripis", "Sahbandar", "Sukakerta", "Sukamulya", "Sukawana"],
    "Jatiwangi": ["Andir", "Burujul Kulon", "Burujul Wetan", "Ciborelang", "Cibentar", "Cicadas", "Jatisura", "Jatiwangi", "Leuweunggede", "Loji", "Mekararsih", "Pinangraja", "Surawangi", "Sutawangi"],
    "Kadipaten": ["Babakan Anyar", "Cipaku", "Heuleut", "Kadipaten", "Karangsambung", "Liangjulang", "Pagandon"],
    "Talaga": ["Argasari", "Campaga", "Cibeureum Kulon", "Cibeureum Wetan", "Cikijing", "Ganeas", "Gunungmanik", "Jatipamor", "Kirmir", "Lampuyang", "Margamukti", "Mekarhurip", "Mekarwangi", "Salado", "Sunia", "Talaga Kulon", "Talaga Wetan"]
  },
  "Kab. Pangandaran": {
    "Pangandaran": ["Babakan", "Purbahayu", "Pananjung", "Pangandaran", "Pagergunung", "Sidomulyo", "Sukahurip", "Wonoharjo"],
    "Parigi": ["Bojong", "Cibenda", "Ciliang", "Cintakarya", "Cintaratu", "Karangbenda", "Karangjaladri", "Parigi", "Parakanmanggu", "Selasari"],
    "Cijulang": ["Batukaras", "Ciakar", "Cibanten", "Cijulang", "Kertayasa", "Kondangjajar", "Margacinta"],
    "Sidamulih": ["Cikalong", "Cikembulan", "Kalijati", "Kersaratu", "Pajaten", "Sidamulih", "Sukaresik"],
    "Kalipucang": ["Bagolo", "Banjarharja", "Cibuluh", "Emplak", "Kalipucang", "Pamotan", "Putrapinggan", "Tunggilis"]
  },
  "Kab. Purwakarta": {
    "Purwakarta": ["Ciseureuh", "Citalang", "Munjuljaya", "Nagri Kaler", "Nagri Kidul", "Nagri Tengah", "Sindangkasih", "Tegalmunjul"],
    "Jatiluhur": ["Bunder", "Cibinong", "Cikaobandung", "Cilegong", "Cisalada", "Jatiluhur", "Jatinunggal", "Kembangkuing", "Mekargalih", "Parakanlima"],
    "Wanayasa": ["Babakan", "Ciawi", "Cibuntu", "Legokhuni", "Nangerang", "Nagrog", "Raharja", "Sakambang", "Simpang", "Sukadami", "Sumurugul", "Taringgul Landeuh", "Taringgul Tonggoh", "Wanasari", "Wanayasa"],
    "Babakancikao": ["Babakancikao", "Cicadas", "Cilangkap", "Ciwareng", "Hegarmanah", "Kadumekar", "Maracang", "Mulyamekar"],
    "Campaka": ["Benteng", "Campaka", "Campakasari", "Cijaya", "Cikumpay", "Cimahi", "Cirende", "Kertamukti", "Karyamekar", "Tanjungsari"]
  },
  "Kab. Subang": {
    "Subang": ["Cigadung", "Dangdeur", "Karanganyar", "Parung", "Pasirkareumbi", "Soklat", "Sukamelang", "Wanareja"],
    "Ciater": ["Ciater", "Cisaat", "Cibeusi", "Cibitung", "Nagrak", "Palasari", "Sanca"],
    "Pamanukan": ["Bongas", "Lengkongjaya", "Mulyasari", "Pamanukan", "Pamanukan Hilir", "Pamanukan Sebrang", "Rancasari", "Sukareja"],
    "Kalijati": ["Banggalamulya", "Caracas", "Cirulo", "Jalupang", "Kaliangsana", "Kalijati Barat", "Kalijati Timur", "Marengmang", "Tanggulun Barat", "Tangulun Timur"],
    "Jalan Cagak": ["Bunihayu", "Curugrendeng", "Jalan Cagak", "Kumpay", "Sarireja", "Tambakan", "Tambakmekar"]
  },
  "Kab. Sukabumi": {
    "Palabuhanratu": ["Buniwangi", "Cibodas", "Cikadu", "Cimanggu", "Citarik", "Citepus", "Jayanti", "Palabuhanratu", "Pasir Suren", "Tonjong"],
    "Cisaat": ["Babakan", "Cibolang Kaler", "Cibolang", "Cisaat", "Gunungjaya", "Kutasirna", "Nagrak", "Padaasih", "Selajambe", "Sukamanah", "Sukamantri", "Sukaresmi", "Sukawarningin"],
    "Cibadak": ["Batununggal", "Cibadak", "Ciheulang Tonggoh", "Karangtengah", "Neglasari", "Pamuruyan", "Sekarwangi", "Sukasira", "Tenjojaya", "Warnajati"],
    "Cicurug": ["Bangbayang", "Benda", "Caringin", "Cicurug", "Cisaat", "Kutajaya", "Mekarsari", "Nanggerang", "Nyaringin", "Pasawahan", "Purwasari", "Tenjoayu"],
    "Sukaraja": ["Cisarua", "Langenensari", "Limbangan", "Margaluyu", "Pasirhalang", "Perbawati", "Selawangi", "Sukaraja", "Sukamaju"],
    "Parungkuda": ["Babakanjaya", "Bojongkokosan", "Kompa", "Langgensari", "Palasari Hilir", "Parungkuda", "Pondokkaso Landeuh", "Sundawenang"]
  },
  "Kab. Sumedang": {
    "Sumedang Utara": ["Girimukti", "Jatimulya", "Kebonjati", "Kotakaler", "Mekar Jaya", "Mulyasari", "Padasuka", "Pasirbiru", "Rancamulya", "Sirnamulya", "Situ", "Talun", "Tanjungmekar"],
    "Sumedang Selatan": ["Baginda", "Cipameungpeuk", "Ciherang", "Cicarimanah", "Gunasari", "Kotakulon", "Margamekar", "Mekar Rahayu", "Pasanggrahan", "Regol Wetan", "Sukagalih", "Sujaya"],
    "Jatinangor": ["Cibeusi", "Cikeruh", "Cilayung", "Cileles", "Cinta Mulya", "Cipacing", "Cisempur", "Hegarmanah", "Jatimukti", "Jatiroke", "Mekargalih", "Sayang"],
    "Tanjungsari": ["Cijambu", "Cinanjung", "Gudang", "Gunungmanik", "Jatisari", "Kadakajaya", "Kutamandiri", "Marga Jaya", "Margaluyu", "Pasigaran", "Rahapura", "Tanjungsari"],
    "Cimalaka": ["Cibeureum Kulon", "Cibeureum Wetan", "Cikole", "Cimalaka", "Cimuja", "Citimun", "Galudra", "Licin", "Mandalaherang", "Nyalindung", "Padasari", "Serang", "Trunamanggala"]
  },
  "Kab. Tasikmalaya": {
    "Singaparna": ["Cikadongdong", "Cikunir", "Cikunten", "Cipakat", "Singaparna", "Singasari", "Sukaherang", "Sukamulya", "Sukarajar", "Sukasari"],
    "Ciawi": ["Bugel", "Ciawi", "Citamba", "Gombong", "Kurniabakti", "Margasari", "Pakemitan", "Pakemitan Kidul", "Pasirhuni"],
    "Rajapolah": ["Dawagung", "Manggungjaya", "Manggungsari", "Rajamandala", "Rajapolah", "Sukaasih", "Sukaraja", "Tanjungpura"]
  }
};

export const APP_NAME = "RekaSDA";
export const VERSION = "1.0.0";

// SNI dan Kriteria Perencanaan untuk Sumber Daya Air
export const WATER_STANDARDS = {
  SNI: {
    'SNI 6728.1:2015': 'Neraca Sumber Daya Air - Bagian 1: Spasial',
    'SNI 6728-1:2015': 'Kebutuhan Air (60-90 L/orang/hari untuk semi-urban)',
    'SNI 2415:2016': 'Perhitungan Debit Banjir untuk Perencanaan Bangunan Air',
    'SNI 6738:2015': 'Perhitungan Debit Andalan Sungai untuk Irigasi'
  },
  KP: {
    'KP-01': 'Perencanaan Jaringan Irigasi',
    'KP-02': 'Bangunan Utama (Bendung dan pengambilan bebas)',
    'KP-03': 'Saluran (Dimensi dan kapasitas saluran irigasi)',
    'KP-04': 'Bangunan (Bangunan bagi, sadap, dan pengukur)',
    'KP-05': 'Petak Tersier (Sistem irigasi tingkat usaha tani)',
    'KP-06': 'Parameter Bangunan (Struktur bangunan irigasi)',
    'KP-07': 'Bangunan Ukur dan Alat Ukur (Pengukuran debit air)'
  }
};
