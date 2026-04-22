# A Happy Ending Probléma

## Három magyar, egy padvacsora, és egy feladvány, ami házassággal végződött

**NotebookLM forrásdokumentum — kb. 12 perces két-szpíker podcasthoz**

---

## Bevezetés — egy budapesti délután 1933 telén

Budapest, 1933 körül. Egy fiatal lány, **Klein Eszter**, huszonéves matematikus, leül egy padra a Városligetben néhány barátjával. A baráti kör nem akármilyen: ott van **Erdős Pál**, húszéves, és **Szekeres György**, huszonhárom éves vegyészmérnök, aki titokban inkább matematikus szeretne lenni, mint vegyész.

Ez a társaság csütörtök vagy vasárnap délutánonként szokott találkozni — nem egyetemen, hanem kint a parkban, egy Anonymus-szobor környékén. Nincs professzor, nincs tábla, nincs tananyag. Csak fiatal, lelkes matematikusok és egy végtelen adag feladvány, amit egymás nyakába öntenek.

Ezen a napon Eszter hozott egyet.

Eszter a következőt vetette fel: *rajzolj a papírra öt pontot, úgy, hogy közülük semmi három ne essen egy egyenesre. Bizonyítsd be, hogy ki lehet választani négyet ezek közül úgy, hogy azok egy domború négyszöget alkossanak.*

A társaság lehajolt, firkált, vitatkozott. Néhány percen belül látszott, hogy az állítás **igaz**, és Eszter ad is rá bizonyítást. De a társaság nem állt meg itt. Erdős és Szekeres azonnal kérdezni kezdett:

- És ha hét pontot veszünk? Mindig találunk köztük öt pontot, amik domború ötszöget alkotnak?
- És kilenc pontot? Hat domború hatszöget?
- Létezik-e minden $n$-re egy olyan szám — nevezzük $\mathrm{ES}(n)$-nek — hogy **bármely** $\mathrm{ES}(n)$ darab pont, ha közülük semmi három nem kollineáris, szükségszerűen tartalmaz $n$ pontot, amelyek domború sokszöget alkotnak?

Ez az, amit ma **Erdős–Szekeres-tétel** néven ismerünk. És ez az, amit Erdős később — miután Szekeres és Klein Eszter összeházasodtak — egész életében csak úgy emlegetett: **a Happy Ending Problem**. A boldog befejezés problémája. Mert az a pad, az a feladvány, és az egy év közös gondolkodás — ezek hozták össze a két matematikust, akik aztán **hatvannyolc évig** voltak házasok.

Ez a mai történet alapja. De ez több, mint csak egy kedves anekdota. Ami a padon elkezdődött 1933-ban, az a kombinatorika egyik legmélyebb problémáját nyitotta meg, és olyan kérdéseket tett fel, amelyeket **még ma, 2026-ban sem tudunk teljesen megválaszolni**.

---

## Az alapfeladvány: öt pont, egy négyszög

Kezdjük a legegyszerűbb esettel. Miért igaz, hogy öt pontból — ha semmi három nincs egy egyenesen — mindig ki lehet választani négyet, amelyek domború négyszöget alkotnak?

Eszter bizonyítása ötletes és elemi. Nézzük meg az öt pont **konvex burkát**. A konvex burok az a legkisebb domború alakzat, amelyik mind az öt pontot tartalmazza — képzeld el, hogy egy gumiszalagot feszítesz rájuk, és elengeded: amit a gumiszalag körbezár, az a konvex burok.

Három eset lehetséges:

**Első eset: a konvex burok egy ötszög.** Akkor mind az öt pont a burok csúcsa. Bármelyik négyet kiválasztod, azok domború négyszöget alkotnak. Kész.

**Második eset: a konvex burok egy négyszög.** Akkor négy pont a burok csúcsa, egy pont pedig belül van. A négy külső pont már eleve egy domború négyszöget alkot. Kész.

**Harmadik eset: a konvex burok egy háromszög.** Ez az érdekes eset. Három pont alkotja a háromszöget, két pont van belül. Húzz egy egyenest ezen a két belső ponton keresztül — ez az egyenes elvágja a háromszöget két részre. Mivel semmi három pont nem kollineáris, a háromszög három csúcsa közül **legalább kettő** esik az egyenes ugyanazon oldalára. Vedd ezt a két csúcsot plusz a két belső pontot — ez a négy pont domború négyszöget alkot. Kész.

Ez a teljes bizonyítás. Mindhárom eset triviális, és együtt lefedik az összes lehetőséget. Eszter zseniális megfigyelése nem a technikában volt, hanem **a feladat megfogalmazásában**. Ő ismerte fel, hogy ez egy érdemleges kérdés — valami mély dolog bújik meg egy gyerekjáték-szerű állítás mögött.

---

## Az általánosítás: az Erdős–Szekeres-tétel

Erdős és Szekeres közösen bebizonyították a fenti feladat általános változatát, és 1935-ben publikálták. Ez volt Erdős egyik első jelentős munkája, és ezzel a cikkel született meg a modern **Ramsey-típusú kombinatorika**.

A tétel azt mondja: minden $n \geq 3$ egészre létezik egy legkisebb pozitív egész szám, jelöljük $\mathrm{ES}(n)$-nek, úgy hogy **bármely** $\mathrm{ES}(n)$ pont a síkon, általános helyzetben (azaz semmi három nem kollineáris), tartalmaz $n$ olyan pontot, amelyek egy domború $n$-szöget alkotnak.

A ma is ismert értékek:
- $\mathrm{ES}(3) = 3$ — bármely három pont háromszög
- $\mathrm{ES}(4) = 5$ — ez Eszter bizonyítása
- $\mathrm{ES}(5) = 9$ — ezt Endre Makai bizonyította a negyvenes években
- $\mathrm{ES}(6) = 17$ — ezt csak **2006-ban** bizonyította be Szekeres György (akkor már 94 éves volt) és Lindsay Peters, **számítógépes keresővel**
- $\mathrm{ES}(7)$ és minden nagyobb érték: **ismeretlen**

Igen — fogd fel ezt egy pillanatra. **Nem tudjuk, hány pont kell ahhoz, hogy mindig legyen köztük hét, ami domború hétszöget alkot.** Ez nem egy egzotikus kérdés a modern matematika szélén. Ez egy elemi iskolás kérdés: pontok, egyenesek, sokszögek. És mégsem tudjuk a választ.

---

## A sejtés és a közel-teljes eredmény

Erdős és Szekeres az eredeti 1935-ös cikkben felső korlátot adtak:

$$\mathrm{ES}(n) \leq \binom{2n-4}{n-2} + 1$$

Ami nagyjából $4^n$ nagyságrendű.

Később, 1960-ban, **alsó** korlátot is adtak. Megkonstruáltak pontos példákat — sokpontos halmazokat, amelyek **nem** tartalmaznak $n$ pontú domború sokszöget. Ezek a konstrukciók bizonyítják, hogy:

$$\mathrm{ES}(n) \geq 2^{n-2} + 1$$

És itt van a legenda. Erdős és Szekeres megfogalmazták a **sejtést**, hogy az alsó korlát valójában a pontos érték:

$$\mathrm{ES}(n) = 2^{n-2} + 1 \quad \text{(sejtés)}$$

Ha ez igaz, akkor:
- $\mathrm{ES}(3) = 2^1 + 1 = 3$ ✓
- $\mathrm{ES}(4) = 2^2 + 1 = 5$ ✓
- $\mathrm{ES}(5) = 2^3 + 1 = 9$ ✓
- $\mathrm{ES}(6) = 2^4 + 1 = 17$ ✓
- $\mathrm{ES}(7) = 2^5 + 1 = 33$? — **nem tudjuk**

A sejtés évtizedeken át állt nyitva, a felső korlát exponenciálisan nagy volt a sejtett értékhez képest. Aztán **2016-2017-ben** egy fiatal amerikai matematikus, **Andrew Suk**, hatalmas áttörést tett:

$$\mathrm{ES}(n) \leq 2^{n + o(n)}$$

Ami azt jelenti, hogy a felső korlát **aszimptotikusan** majdnem pontosan összetalálkozik az alsóval. Gyakorlatilag bizonyította a sejtést — csak egy apró, $o(n)$-es hiba marad az exponensben. A matematikusok azóta is dolgoznak azon, hogy ezt az utolsó rést is bezárják.

Tehát ez nem egy holt probléma. Ez egy **élő** probléma, amin ma is dolgoznak, és ami 93 éves múltra tekint vissza.

---

## A bizonyítás szíve: a Ramsey-trükk

Az eredeti bizonyítás nagyon szép, és érdemes legalább vázolni. Erdős és Szekeres két bizonyítást is adtak. Nézzük a Ramsey-alapút.

**Ramsey tétele** (1930) azt mondja: ha eléggé sok pontot veszel, és minden pontpárt kiszínezel piros vagy kék színnel, akkor szükségszerűen találsz $n$ pontot, amelyek **összes** páros éle ugyanolyan színű. Bármilyen színezésre.

Erdős és Szekeres ezt használja, mégpedig nagyon ötletesen. Vegyél sok pontot a síkon, általános helyzetben. Rendezd őket balról jobbra az $x$-koordinátájuk szerint. Most minden pontpárra nézd meg: a tőlük húzott szakasznak **pozitív** vagy **negatív** a meredeksége? Ez egy 2-színezés az élhalmazon.

Ramsey tétele garantálja, hogy ha elég sok pontod van, akkor találsz $n$ pontot, amelyek közti **összes** szakasz ugyanolyan meredekségű — vagy mind pozitív, vagy mind negatív. Ez azt jelenti, hogy ez a $n$ pont **monoton** — vagy mind felfelé megy, vagy mind lefelé. Egy ilyen monoton $n$-pontos halmaz pedig mindig domború sokszöget alkot. Kész.

Ez a bizonyítás azért szép, mert megmutatja, hogy a **geometria** (pontok a síkon) és a **tiszta kombinatorika** (élek színezése) ugyanannak az érmének a két oldala. Erdős egész karrierje erről szólt — átjárókat építeni látszólag különböző matematikai területek között.

Az Erdős–Szekeres-cikk 1935-ből tulajdonképpen **újrafelfedezte Ramsey tételét**. Erdős nem tudta, hogy Frank Ramsey öt évvel korábban már publikálta ugyanazt (angol logikusként, egy teljesen más motivációval). A kombinatorika történetében ez az egyik leghíresebb párhuzamos felfedezés.

---

## Visszatérés a szerelemhez

Térjünk vissza Klein Eszterhez és Szekeres Györgyhöz, mert az ő történetük legalább olyan szép, mint a matematika.

Az 1930-as évek Magyarországán fiatal zsidó értelmiségiként élni egyre nehezebb volt. A numerus clausus, majd a zsidótörvények. Szekeres és Eszter 1937-ben összeházasodtak, részben a matematikai problémán keresztül kialakult közös nyelv miatt. Erdős akkor keresztelte el a feladványt Happy Ending Problem-nek, és ez a név rajta is maradt.

1938-ban elmenekültek Kínába, egy sanghaji gyárba, ahol Szekeres vegyészként dolgozott — a matematikát hobbiként, este, egy függönnyel leválasztott sarokban űzte. Nyolc évig bujkáltak Kínában, háború közepette, gyerekkel. Csak 1948-ban tudtak kiszabadulni — Ausztráliába költöztek, ahol Szekeres az Adelaide-i egyetem matematikus professzora lett.

Ausztráliában Szekeres visszatért a matematikához. Úttörő munkát végzett a relativitáselméletben, a számítógépes keresésben, a sorozatokban, és persze folytatta az Erdős–Szekeres-programot. Eszter szintén matematikus maradt élete végéig.

Végül — és ez a legmegdöbbentőbb rész — **Szekeres György és Klein Eszter ugyanazon a napon haltak meg**. 2005. augusztus 28-án, Adelaide-ben, egy óra különbséggel. Szekeres 94 éves volt, Eszter 95. Hatvannyolc év házasság után, kéz a kézben, ugyanabban a kórházban.

Erdős már nem élt — ő 1996-ban ment el. De a Happy Ending Problem szó szerint happy ending-gel fejeződött be.

Ezért hívják még ma is ezen a néven. Nem azért, mert a matematikát megoldották. Hanem azért, mert a három ember, aki a kérdést feltette, meg is találta egymást.

---

## Miért fontos ez ma?

Két ok.

**Az első:** az Erdős–Szekeres-tétel egy gyökeres változást hozott a kombinatorikában. Azt a fajta gondolkodást, amiben a „rend" és a „káosz" kombinatorikus kérdéssé válik. Ez a paradigma — hogy **elég nagy rendszerben szükségszerűen felbukkan a rend** — ma az egész modern kombinatorika alapja. A számelméletben a Green–Tao-tétel a prímekről aritmetikai sorozatokban, az additív kombinatorikában a Szemerédi-tétel, a teljes Ramsey-elmélet, a gráfszínezési problémák — mind ugyanebből a gyökérből nőttek ki. Szemerédi is magyar — ez nem véletlen. Budapest, az Anonymus-szobor környéke, az a pad — ez a modern kombinatorika szülővárosa.

**A második:** ez egy élő probléma. Gyerekek is megértik. Bárki le tud ülni egy papír mellé és megpróbálhatja. A válasz még ma sem teljes. Ha te, aki ezt hallgatod, elmész egy egyetemre matekot tanulni, és ráteszed az életedet Andrew Suk munkájára, és végül bezárod az utolsó rést — a matematika öröklétében feltett kérdésre fogsz választ adni, amit 1933 telén három fiatal magyar egy padon kitalált.

Ez a matematika szépsége. A feladat egyszerű, a megoldás megfoghatatlan, és a kettő között ott van minden, amit az emberi elme kitalált az elmúlt kilenc évtizedben.

---

## Összefoglalás

**A történet:** 1933, Budapest, három magyar matematikus egy padon. Klein Eszter felvet egy feladványt, amit Erdős és Szekeres általánosít. A feladatból 1937-ben házasság lesz, 68 év közös élet, és 2005-ben egyazon napi halál Adelaide-ben.

**A matematika:** az Erdős–Szekeres-tétel szerint minden $n$-re van egy szám $\mathrm{ES}(n)$, úgy hogy bármely $\mathrm{ES}(n)$ darab pont általános helyzetben tartalmaz $n$ pontot domború helyzetben. A sejtés szerint $\mathrm{ES}(n) = 2^{n-2} + 1$. Andrew Suk 2016-17-ben aszimptotikusan bizonyította.

**A kapocs:** ez a feladat az egész modern kombinatorika egyik alapköve. Ramsey-elmélet, Szemerédi-tétel, Green-Tao — mind innen nőttek ki.

**A név:** Happy Ending Problem, mert a három magyar, aki feltette, megtalálta egymásban a matematikán kívüli boldogságot is.

---

## Források, amikre érdemes hivatkozni

- Erdős, P. & Szekeres, G. (1935). *A combinatorial problem in geometry.* Compositio Mathematica, 2, 463–470. [a credit paper]
- Erdős, P. & Szekeres, G. (1960). *On some extremum problems in elementary geometry.* Annales Universitatis Scientiarum Budapestinensis, 3-4, 53–62.
- Szekeres, G. & Peters, L. (2006). *Computer solution to the 17-point Erdős–Szekeres problem.* ANZIAM Journal, 48, 151–164.
- Suk, A. (2017). *On the Erdős–Szekeres convex polygon problem.* Journal of the American Mathematical Society, 30, 1047–1053.
- Életrajzi anyag Szekeres Györgyről és Klein Eszterről: University of New South Wales matematikai archívuma, ausztrál obituary-k 2005-ből.

---

*Ezt a dokumentumot NotebookLM-be töltve egy ~10-12 perces, két-szpíker podcast-audio generálható. A dokumentum végleges, copyright-mentes eredeti írás.*
