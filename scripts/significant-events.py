"""Selection of the most significant events (Phase 3).

The list R below is the agreed selection with the reason for each choice. Its order is used only
internally (`significanceRank`, 1–100, required by the data schema); the app shows the selection in
date order without numbers. Run without arguments to regenerate docs/most-significant-events.md;
run with --apply to write `significanceRank` into the event files.
"""
import sys
import json, glob, collections
ev = {e["id"]: e for f in glob.glob("src/data/events/*.json") for e in json.load(open(f))}
R = [
("auschwitz-camp-1940","The largest German camp; over a million murdered, ~90% Jews; also Poles, Roma, Soviet POWs."),
("treblinka-camp-1942","About 900,000 murdered – the deadliest Operation Reinhardt camp."),
("warsaw-uprising-1944","Largest uprising in occupied Europe; ~200,000 dead; defining event of Polish memory."),
("katyn-massacre-1940","Soviet murder of ~22,000 officers and prisoners; central to Polish memory and post-war politics (documented exception: outside the map area)."),
("volhynia-massacres-1943","UPA mass murder of 80,000–120,000 Poles, classified by IPN as genocide."),
("soviet-invasion-1939","Soviet invasion in coordination with Germany; Poland partitioned between the two."),
("westerplatte-1939","Opening shots of the Second World War; national symbol."),
("warsaw-ghetto-uprising-1943","Largest Jewish revolt; global symbol of resistance."),
("belzec-camp-1942","~440,000–450,000 Jews deported to the camp and murdered."),
("grossaktion-warschau-1942","Deportation of ~300,000 Warsaw Jews to Treblinka in two months."),
("siege-of-warsaw-1939","Defence and bombardment of the capital until its capitulation."),
("bzura-1939","Largest battle of the September Campaign."),
("sobibor-camp-1942","~180,000 Jews murdered; site of the October 1943 revolt."),
("chelmno-camp-1941","First German extermination camp using gas; ~200,000 Jews murdered."),
("majdanek-camp-1941","Concentration camp and Aktion Reinhardt killing site on the edge of Lublin."),
("soviet-deportation-feb-1940","First Soviet mass deportation of Polish citizens to the USSR."),
("lodz-ghetto-1940","Second-largest ghetto, the longest-lasting."),
("warsaw-ghetto-sealed-1940","Largest ghetto in Europe sealed (~400,000 people)."),
("wola-massacre-1944","Largest single massacre of the Uprising (tens of thousands of civilians)."),
("pomeranian-crime-1939","Extermination of Polish elites in Pomerania; ~16,000 victims."),
("piasnica-1939","Largest mass-murder site of 1939–40 in Pomerania (12,000–14,000)."),
("stutthof-camp-1939","Camp opened on 2 September 1939; ~65,000 victims."),
("vistula-oder-offensive-1945","Drove the Wehrmacht out of most Polish lands; start of Soviet domination."),
("general-government-1939","Creation of the German occupation regime in central Poland."),
("annexation-western-poland-1939","Incorporation of western Poland into the Reich; germanisation policy."),
("soviet-annexation-1939","Soviet incorporation of eastern Poland after staged votes."),
("ab-aktion-1940","Planned extermination of the Polish intelligentsia and underground."),
("palmiry-executions-1939","Symbolic execution site of Warsaw's elites (~1,700 victims)."),
("sonderaktion-krakau-1939","Arrest of Kraków's professors – emblem of the war on Polish culture."),
("erntefest-1943","Mass shooting of ~42,000 Jews in the Lublin district in November 1943."),
("zamosc-expulsions-1942","Expulsion of ~100,000 Poles and kidnapping of children under Generalplan Ost."),
("ponary-1941","~100,000 murdered near Wilno – Jews, Poles and others."),
("jedwabne-1941","Murder of Jews by Polish neighbours acting at German inspiration (IPN, 2003); central to Polish–Jewish memory debates."),
("nkvd-prison-massacres-1941","NKVD murder of thousands of prisoners as the Soviets retreated."),
("barbarossa-1941","German attack on the USSR; start of the Holocaust by bullets in the east."),
("lodz-ghetto-liquidation-1944","Last major ghetto destroyed; deportations to Auschwitz."),
("auschwitz-liberation-1945","Liberation of the largest camp; its anniversary (27 January) is the international Holocaust remembrance date."),
("auschwitz-death-marches-1945","Evacuation of ~56,000 prisoners; at least 9,000 dead."),
("pruszkow-dulag-1944","Transit camp for ~550,000 expelled Varsovians."),
("destruction-of-warsaw-1944","Systematic razing of the capital after the Uprising."),
("ak-founded-1942","Creation of the Home Army, the main underground army."),
("zegota-1942","Council to Aid Jews under the Government Delegate – a unique rescue organisation."),
("ulma-family-1944","Murder of rescuers and the Jews they hid; national day of remembrance of Poles rescuing Jews."),
("pilecki-auschwitz-1940","Witold Pilecki lets himself be arrested to get into Auschwitz and organise resistance there."),
("oneg-szabat-1940","Ringelblum Archive – the Warsaw ghetto's own documentation."),
("korczak-deportation-1942","Korczak and the orphans – one of the best-known moments of the Holocaust."),
("treblinka-revolt-1943","Prisoner revolt in an extermination camp."),
("sobibor-revolt-1943","Prisoner revolt and mass escape from Sobibór."),
("bialystok-ghetto-uprising-1943","Second-largest ghetto uprising."),
("volhynia-bloody-sunday-1943","Coordinated UPA attacks on more than 100 Polish localities on 11 July 1943; the peak of the Volhynia massacres."),
("huta-pieniacka-1944","Destruction of a Polish village with over 850 victims by an SS police regiment and UPA."),
("roma-camp-liquidation-1944","Murder of ~4,300 Roma in one night; Roma and Sinti Genocide Remembrance Day (2 August)."),
("hungarian-jews-auschwitz-1944","Deportation and murder of Hungarian Jews at Auschwitz in spring and summer 1944."),
("ostra-brama-1944","AK battle for Wilno and its aftermath of Soviet arrests."),
("lwow-tempest-1944","AK in the battle for Lwów and NKVD repression afterwards."),
("pkwn-1944","Communist puppet authority proclaimed under Soviet protection."),
("arrest-of-the-sixteen-1945","NKVD kidnapping of the Underground State's leaders."),
("ak-dissolution-1945","End of the Home Army; continuation of resistance under new occupation."),
("kutschera-1944","AK carries out the death sentence on the SS and Police Leader of Warsaw."),
("arsenal-action-1943","Grey Ranks rescue of 'Rudy'; emblem of youth resistance."),
("grot-arrest-1943","Loss of the AK commander to the Gestapo."),
("wielun-bombing-1939","Bombing of a defenceless town at the war's outset."),
("polish-post-office-danzig-1939","Defence of the Polish post office in Danzig; defenders later executed."),
("defence-of-lwow-1939","Defence of Lwów against German and Soviet forces."),
("kock-1939","Last battle of the September Campaign."),
("mokra-1939","Volhynian Cavalry Brigade halts a panzer division on the first day."),
("wizna-1939","'Polish Thermopylae' – symbolic last-stand defence."),
("modlin-1939","Defence of the Modlin fortress."),
("grodno-1939","Defence of Grodno against the Red Army."),
("government-crosses-into-romania-1939","State authorities go into exile; basis of the continuity of the Polish state."),
("soldau-camp-1939","'Hidden extermination centre' for northern Mazovia's elites; at least 8,000 dead."),
("fort-vii-camp-1939","Konzentrationslager Posen – described by IPN as the first German concentration camp in occupied Poland (sources differ)."),
("gross-rosen-camp-1940","Major concentration camp in Lower Silesia; ~40,000 victims."),
("plaszow-camp-1942","Kraków camp under Amon Göth; thousands murdered."),
("lwow-great-action-1942","Deportation of ~50,000 Lwów Jews to Bełżec."),
("stanislawow-bloody-sunday-1941","Shooting of 10,000–12,000 Jews in one day."),
("lwow-professors-1941","Murder of Lwów's professors – symbol of the destruction of Polish elites."),
("lwow-pogroms-1941","Pogroms in Lwów after the German entry."),
("bialystok-synagogue-1941","Burning of Białystok's Great Synagogue with ~2,000 Jews inside."),
("warsaw-street-executions-1943","Terror of public street executions in Warsaw (~5,000 killed)."),
("michniow-1943","Emblematic German pacification of a village – burned with its inhabitants."),
("ochota-massacre-1944","Massacre of civilians in Ochota during the Uprising (RONA)."),
("sahryn-1944","AK and BCh attack on Ukrainian villages in the Lublin region; described by IPN as collective responsibility."),
("pawlokoma-1945","Killing of Ukrainian villagers by a post-AK unit; President Lech Kaczyński took part in the 2006 commemoration."),
("naliboki-1943","Massacre of Polish villagers by Soviet partisans."),
("upper-silesia-deportations-1945","Soviet deportation of tens of thousands of Upper Silesians; 'Upper Silesian Tragedy'."),
("miechowice-massacre-1945","Red Army massacre of nearly 380 civilians in Upper Silesia."),
("soviet-deportation-apr-1940","Deportation of Katyń victims' families to Kazakhstan."),
("poznan-1945","One of the heaviest battles on Polish soil in 1945."),
("siege-of-breslau-1945","Festung Breslau held out for about 80 days, capitulating on 6 May 1945."),
("gdansk-1945","Capture and destruction of Gdańsk; Soviet terror against Poles and Germans."),
("kolobrzeg-1945","Eleven days of street fighting; the 1st Polish Army reaches the Baltic."),
("studzianki-1944","Major battle of the Polish 1st Armoured Brigade on the Magnuszew bridgehead."),
("radogoszcz-1945","Largest German crime in Łódź – prisoners burned alive (~1,500)."),
("stutthof-death-march-1945","Death march of Stutthof prisoners through Kashubia."),
("hubal-unit-1939","Maj. Hubal's unit fights on after the capitulation; symbol of continued resistance."),
("szczurowa-1943","Largest Roma mass grave in Poland outside Auschwitz – emblem of the Roma genocide."),
("glinciszki-dubinki-1944","Polish–Lithuanian cycle of killings in the Wilno region."),
("przebraze-1943","Largest Polish self-defence centre in Volhynia; ~12,000 saved."),
("osuchy-1944","One of the largest partisan battles on Polish soil."),
]
assert len(R)==100 and len({i for i,_ in R})==100, len(R)
missing=[i for i,_ in R if i not in ev]; assert not missing, missing
NEAR=["parosla-1943","warsaw-churches-bombing-1944","defence-of-hel-1939","tomaszow-lubelski-i-1939","bydgoszcz-executions-1939","fordon-valley-of-death-1939","death-penalty-decree-1941","koniuchy-1944","gesiowka-liberation-1944","kl-warschau-1943","bedzin-sosnowiec-ghetto-uprising-1943","sonderkommando-revolt-1944","warsaw-entry-1945","oder-crossing-siekierki-1945","kurylowka-1945","swinoujscie-bombing-1945","wilhelm-gustloff-1945","surkonty-1944","soviet-deportation-jun-1940","majdanek-liberation-1944"]
for i in NEAR: assert i in ev, i
FAM={"battle":"military","siege":"military","liberation":"military","massacre":"civilian","bombing":"civilian","deportation":"civilian","camp":"civilian","occupation_policy":"civilian","uprising":"resistance","resistance_operation":"resistance","other":"other"}
top=[ev[i] for i,_ in R]
def title(e): return e["title"]["en"]
if "--apply" in sys.argv:
    rank={i:n for n,(i,_) in enumerate(R,1)}
    for f in glob.glob("src/data/events/*.json"):
        arr=json.load(open(f))
        for e in arr:
            if e["id"] in rank:
                items=[(k,v) for k,v in e.items() if k!="significanceRank"]
                out={}
                for k,v in items:
                    if k=="sources": out["significanceRank"]=rank[e["id"]]
                    out[k]=v
                e.clear(); e.update(out)
            else:
                e.pop("significanceRank",None)
        json.dump(arr,open(f,"w"),ensure_ascii=False,indent=2); open(f,"a").write("\n")
    print("significanceRank written for",len(rank),"events")
L=["# Most significant events","",
"The app's **Most significant events** view („Najważniejsze wydarzenia”) shows a selection of 100 events from the map. They are listed **by date, without numbers or positions** – the selection is not a ranking of suffering.","",
"## How the selection was made","",
"Each event was weighed on four criteria:","",
"1. **Human loss** – the scale of killing, deportation or destruction, using the figures recorded in the data.",
"2. **Historical consequence** – turning points for the course of the war and the fate of the Polish state (invasions, annexations, occupation regimes, the end of the Home Army).",
"3. **Place in memory** – events that anchor Polish, Jewish and international remembrance (days of remembrance, emblematic sites and people).",
"4. **Breadth** – the selection covers every year of the war and every major group of victims and perpetrators, so it is not dominated by one place or one kind of event.","",
"The data schema stores an internal order (`significanceRank`, 1–100) produced by `scripts/significant-events.py`; it is used only to decide what is included and is not displayed.","",
"## Coverage","",
]
yc=collections.Counter(e["startDate"][:4] for e in top); ya=collections.Counter(e["startDate"][:4] for e in ev.values())
L+=["| Start year | Selected | All events |","|---|---|---|"]+[f"| {y} | {yc[y]} | {ya[y]} |" for y in sorted(ya)]+[""]
fc=collections.Counter(FAM[e["type"]] for e in top); fa=collections.Counter(FAM[e["type"]] for e in ev.values())
L+=["| Kind | Selected | All events |","|---|---|---|"]+[f"| {f} | {fc[f]} | {fa[f]} |" for f in ["military","civilian","resistance","other"]]+[""]
L+=["**Perpetrators represented:** Germany (incl. SS, police and auxiliary formations), the Soviet Union (Red Army, NKVD, Soviet partisans), the UPA, Polish perpetrators (local inhabitants at Jedwabne; underground units at Sahryń and Pawłokoma), Lithuanian police.","",
"**Victim groups represented:** Poles, Jews, Roma, Ukrainians, Lithuanians, Soviet POWs (Auschwitz), Germans (Breslau, Upper Silesian deportees of German nationality).","",
"## The selection (in date order)","","| Event | Dates | Kind | Why it is included |","|---|---|---|---|"]
why={i:w for i,w in R}
for e in sorted(top, key=lambda e:(e["startDate"],e["id"])):
    d=e["startDate"] if e["startDate"]==e["endDate"] else f'{e["startDate"]} – {e["endDate"]}'
    L.append(f"| {title(e)} | {d} | {e['type'].replace('_',' ')} | {why[e['id']]} |")
L+=["","## Considered but not selected","","These remain on the map and in the timeline; any of them can replace a selected event.",""]
for i in NEAR:
    e=ev[i]; L.append(f"- {title(e)} ({e['startDate']})")
L+=["","## Notes","",
"- **Katyń** lies outside the map area (a documented exception) but is included because of its central place in Polish history.",
"- The Warsaw Uprising and two of its massacres (Wola, Ochota) are all included, because the massacres are among the largest crimes against civilians of the war.",""]
open("docs/most-significant-events.md","w").write("\n".join(L))
print("written", len(R))
