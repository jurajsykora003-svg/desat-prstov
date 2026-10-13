/* =========================================================================
   SLOVENSKÉ SLOVÁ – vlastný zoznam (nie z učebnice).
   Z neho sa skladajú cvičenia: ku každej lekcii sa vyberú len slová,
   ktoré obsahujú iba písmená naučené do danej lekcie.
   Pridať slová: stačí ich dopísať kamkoľvek do zoznamu (oddelené medzerou).
   ========================================================================= */
const SK_WORDS = [...new Set(`
aj ak ako ale alebo ani až bez by cez čo či do ho ich iba ja je jej jeho kde keď kto ku len ma mi my na nad nie no od on ona ono oni ony po pod pre pri sa si so sme ste sú tak tam ten tá to tu ty už vo vy za zo že aby lebo preto teda tiež áno možno určite naozaj

dal dala dali sad sada sady jas lak sklad sklady skala skaly slad kajak fajka fajky dlaha hala haly halda hlas hlasy hlad gala
les lesy leje ide jedla deka kefa fialka liek lieky sila ihla lieh jed hej sedí
ruka ruky dar dary kura sud sudy jar hrad hrady kruh druh druhy hra hry kraj kraje fuj sukne riadi
tak tu test testy tri trh trhy zrak tuk tiket tieto
dielo jedlo kolo koleso kolesá auto autá slovo slová oko oči ucho uši nos hlava hlavy

mama otec brat sestra syn dcéra dedo babka teta ujo rodina rodič rodičia dieťa deti chlapec dievča muž žena pán pani slečna
priateľ priateľka kamarát kamarátka sused suseda človek ľudia kolega kolegyňa žiak žiačka študent študentka učiteľ učiteľka
riaditeľ riaditeľka šéf vedúci zamestnanec zamestnávateľ zákazník klient dodávateľ odberateľ predajca kupujúci
účtovník účtovníčka sekretárka asistent manažér referent pracovník robotník lekár lekárka sestrička vodič kuchár čašník
predavačka policajt hasič právnik notár sudca herec herečka spevák umelec sedliak gazda

škola školy trieda triedy lavica tabuľa krieda zošit zošity kniha knihy učebnica pero perá ceruzka guma pravítko taška
peračník hodina hodiny prestávka úloha úlohy test písomka skúška známka známky vysvedčenie maturita rozvrh predmet
matematika slovenčina angličtina nemčina dejepis zemepis fyzika chémia biológia informatika ekonomika účtovníctvo
administratíva korešpondencia telocvik jedáleň šatňa chodba ihrisko otázka otázky odpoveď príklad cvičenie lekcia
strana riadok riadky slovo veta vety text písmeno písmená číslo čísla znak kláves klávesy klávesnica myš monitor
obrazovka počítač notebook tlačiareň súbor priečinok dokument tabuľka program internet heslo správa správy mail

kancelária firma firmy podnik spoločnosť obchod obchody predajňa sklad tovar výrobok výrobky služba služby cena ceny
zľava faktúra faktúry účet účty doklad doklady pokladnica peniaze hotovosť platba splátka úver banka poplatok daň dane
mzda plat prémia zisk strata príjem výdavok náklad náklady rozpočet objednávka objednávky ponuka dopyt zmluva zmluvy
dohoda reklamácia záruka dodávka dodací expedícia inventúra evidencia archív register pečiatka podpis list listy
obálka pošta balík adresa adresát odosielateľ príjemca dátum termín porada schôdza stretnutie rokovanie návrh plán
cieľ projekt prezentácia zápisnica žiadosť potvrdenie oznámenie pozvánka ospravedlnenie sťažnosť výpoveď životopis
inzerát pohovor telefón hovor linka kópia originál formulár tlačivo kalkulácia výkaz prehľad štatistika graf trh
konkurencia reklama predaj nákup výroba export import colnica preprava kamión vagón kontajner paleta krabica obal
etiketa katalóg cenník sortiment zásoba zásoby objem obrat tržba investícia akcia akcie majiteľ konateľ živnosť
podnikateľ úrad úradník ministerstvo štát obec mesto kraj okres sídlo pobočka oddelenie vedenie kvalita výkon

dom domy byt byty izba izby kuchyňa kúpeľňa záhrada garáž dvor brána dvere okno okná stena steny strecha podlaha
schody stôl stoly stolička posteľ skriňa polica lampa koberec záclona zrkadlo hodinky kľúč kľúče zámok televízor
rádio chladnička sporák rúra hrnček pohár poháre tanier taniere lyžica vidlička nôž hrniec panvica fľaša kanvica
mydlo uterák kefka hrebeň peňaženka dáždnik bunda kabát sveter tričko košeľa nohavice sukňa šaty topánky čiapka
šál rukavice okuliare

chlieb rožok maslo syr šunka saláma vajce vajcia mlieko jogurt mäso ryba kura polievka zemiaky ryža cestoviny
knedľa omáčka šalát zelenina ovocie jablko jablká hruška slivka čerešňa jahoda malina banán citrón pomaranč hrozno
mrkva cibuľa cesnak paprika rajčina uhorka kapusta fazuľa hrach cukor soľ korenie múka olej med čokoláda koláč
torta keks zmrzlina voda čaj káva džús limonáda raňajky obed večera desiata nápoj kaša halušky

slnko mesiac hviezda obloha mrak dážď sneh vietor búrka hmla mráz počasie jar leto jeseň zima ráno deň poludnie
večer noc týždeň rok minúta sekunda čas strom stromy kvet kvety tráva lístok les hora hory kopec dolina rieka potok
jazero more ostrov pole lúka kameň piesok zem oheň vzduch zviera pes psy mačka kôň kone krava prasa ovca koza sliepka
kohút kačka hus vták vtáky myš zajac líška vlk medveď jeleň srna veverička ježko žaba had včela mucha motýľ mravec
vŕba kríky húba huby

ulica ulice cesta cesty chodník námestie most park kostol nemocnica lekáreň kino divadlo múzeum knižnica hotel
reštaurácia kaviareň štadión stanica letisko zastávka autobus vlak vlaky električka trolejbus taxík bicykel lietadlo
loď cestovanie dovolenka výlet kufor mapa smer sever juh východ západ vľavo vpravo rovno dole blízko ďaleko dedina

vlasy zub zuby jazyk krk rameno prst prsty dlaň noha nohy koleno chrbát brucho srdce kĺb palec malíček ukazovák
prostredník prstenník

dobrý zlý veľký malý nový starý mladý pekný škaredý dlhý krátky vysoký nízky široký úzky ťažký ľahký rýchly pomalý
teplý studený horúci chladný svetlý tmavý biely čierny červený modrý zelený žltý hnedý sivý ružový fialový oranžový
čistý špinavý plný prázdny drahý lacný bohatý chudobný šťastný smutný veselý unavený hladný smädný zdravý chorý
silný slabý múdry milý zlatý presný správny dôležitý zaujímavý jednoduchý hlavný ďalší posledný prvý druhý tretí
každý celý iný vlastný rovnaký možný potrebný pracovný obchodný školský denný ročný mesačný verejný súkromný
slovenský český anglický nemecký európsky svetový dobrá nová veľká malá stará krásna milá

byť mať ísť prísť odísť robiť urobiť písať napísať čítať prečítať počítať učiť hovoriť povedať rozprávať počúvať
počuť vidieť pozerať hľadať nájsť dať dávať brať vziať niesť nosiť kupovať kúpiť predávať predať platiť zaplatiť
posielať poslať dostať prijať otvoriť zatvoriť začať skončiť pracovať pomáhať pomôcť chcieť môcť musieť vedieť
poznať myslieť rozumieť pamätať zabudnúť spať jesť piť variť bývať žiť sedieť stáť ležať behať bežať chodiť plávať
lietať cestovať hrať spievať tancovať smiať plakať čakať volať zavolať telefonovať opakovať cvičiť trénovať skúšať
vyplniť podpísať objednať dodať vybaviť skontrolovať uložiť vytlačiť kopírovať triediť evidovať odpovedať pýtať
ďakovať prosiť ďakujem prosím robím píšem čítam mám idem ideme bol bola bolo boli bude budem môžem musím chcem
viem dám píše čaká stojí beží sedí leží robí vidí vie má sme boli

dnes zajtra včera teraz potom skoro neskoro vždy nikdy často niekedy ešte hneď rýchlo pomaly dobre zle veľmi trochu
viac menej spolu sám prečo kedy koľko kam odkiaľ

jeden jedna jedno dva dve tri štyri päť šesť sedem osem deväť desať jedenásť dvanásť dvadsať tridsať štyridsať
päťdesiat sto tisíc milión polovica štvrtina

pondelok utorok streda štvrtok piatok sobota nedeľa január február marec apríl máj jún júl august september október
november december víkend sviatok prázdniny

móda gól tón pór ďakovať ďalej ďaleko ďateľ kĺby vĺna stĺp vŕtať krk štvrť

auto banka biely blízko bod brána centrum čas často čaj čí dať doba dosť dvere fakt farba film fond fotka hore hudba
chyba chýbať istý jasný jazyk krása krok kus ľad ľahko meno miesto mobil moja náš osoba papier pomoc práca pravda rád
rada smer stav suma ťava túto uzol váha veda život agenda daňový hlásenie hodnota kontakt sekretariát tlač úspech
výnos zmena zoznam aleja jasle salaš daždovka hádaj fakľa sadla hľadá klas laso lesk jaskyňa kaz dukát
`.trim().split(/\s+/))];
