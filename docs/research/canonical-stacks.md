# The named technology stack encyclopedia

Named technology stacks — acronyms bundling an OS, server, database, and language (or framework equivalents) into a catchy shorthand — are a phenomenon that began with a single German magazine article in 1998 and exploded into a naming tradition that persists today. **Michael Kunze deliberately coined "LAMP" as a marketing device for open-source software**, knowing the IT world's affinity for acronyms. Every stack name since traces its lineage to that moment. This reference document covers **50+ named stacks** with verified origins, attribution confidence levels, and current status. Where the coiner is unknown or disputed, it says so explicitly.

---

## Schema

Each entry follows this structure:

```
### STACK_NAME
- **Components:** What each letter stands for
- **Coined by:** Specific person (or "Community — no individual attributed")
- **Date:** When first used, with source link where available
- **Status:** Active / Legacy / Deprecated / Niche
- **Attribution confidence:** High / Medium / Low
- **Notes:** Additional context
```

---

## I. The LAMP dynasty

The stack that started it all and its direct OS-swap, server-swap, and database-swap variants.

### LAMP
- **Components:** **L**inux, **A**pache, **M**ySQL, **P**HP/Perl/Python
- **Coined by:** **Michael Kunze**, German tech journalist
- **Date:** **December 1998**, in the German computing magazine *c't* (Computertechnik). Kunze crafted the acronym deliberately as a marketing device for free software. O'Reilly Media and MySQL AB subsequently popularized it in the English-speaking world.
- **Original source:** Print article in c't magazine (not available online; predates widespread web archiving of German print). Corroborated by [Computerworld](https://www.computerworld.com/article/1705954/lamp.html) and [Wikipedia](https://en.wikipedia.org/wiki/LAMP_(software_bundle)).
- **Status:** **Active.** Still powers WordPress, Drupal, Joomla, and a massive share of the web. All major cloud providers offer managed LAMP deployments.
- **Attribution confidence:** **High** — universally credited across all sources.

### LEMP (also LNMP)
- **Components:** **L**inux, **N**ginx ("**E**ngine-X"), **M**ySQL/MariaDB, **P**HP
- **Coined by:** Community — no individual attributed. The acronym emerged as Nginx surged in market share after ~2008. The site lemp.io explains the naming rationale ("LEMP is actually pronounceable") but does not claim coinage. In China and Russia, the variant **LNMP** is more common.
- **Date:** ~**2008–2012**. No original coinage post found.
- **Status:** **Very active** and growing. Nginx is now one of the two dominant web servers globally.
- **Attribution confidence:** **Low.**

### LAPP
- **Components:** **L**inux, **A**pache, **P**ostgreSQL, **P**HP/Perl/Python
- **Coined by:** Community — no individual attributed.
- **Date:** Early **2000s.**
- **Status:** **Active.** PostgreSQL's surge in popularity has given this variant renewed relevance.
- **Attribution confidence:** **Low.**

### WAMP
- **Components:** **W**indows, **A**pache, **M**ySQL, **P**HP
- **Coined by:** Community — natural OS-substitution of LAMP. The **WampServer** software product was created by **Romain Bourdon** (French developer, EPITA graduate) and first released in **2003**, but the generic "WAMP" term likely predates the software.
- **Date:** Term: early **2000s**. WampServer product: **2003.**
- **Status:** **Active.** WampServer 3.3.7 released October 2025. Used primarily for local Windows development.
- **Attribution confidence:** **Low** for the acronym. **High** that Romain Bourdon created WampServer.

### XAMPP
- **Components:** Cross-platform (**X**), **A**pache, **M**ariaDB/MySQL, **P**HP, **P**erl. Now a recursive acronym: "XAMPP Apache + MariaDB + PHP + Perl."
- **Coined by:** **Kai "Oswald" Seidler** and **Kay Vogelgesang**, who co-founded the **Apache Friends** project.
- **Date:** **2002.** Seidler (TU Berlin CS graduate, 1999) and Vogelgesang (freelance systems engineer and author of several books on Apache/MySQL) released XAMPP through SourceForge.
- **Original source:** [Apache Friends — About](https://www.apachefriends.org/about.html)
- **Status:** **Active but slowing.** Last significant update November 2023. Ownership has passed through BitRock → VMware → Broadcom. Increasingly superseded by Docker and similar tools.
- **Attribution confidence:** **High.**

### MAMP
- **Components:** **M**acOS, **A**pache, **M**ySQL/MariaDB, **P**HP
- **Coined by:** **Holger Meyer**, founder of MAMP GmbH (Wörth am Rhein, Germany), created the MAMP software product. The four-letter acronym as a concept may have existed informally before the product, as a natural LAMP variant.
- **Date:** MAMP 1.0: **2005.** Showcased at Macworld Expo 2007. MAMP for Windows launched 2015. Celebrated its 20th anniversary in 2025.
- **Original source:** [MAMP.ONE retrospective](https://www.mamp.one/it-was-twenty-years-ago-today-a-retrospective-and-a-look-to-the-future-of-mamp/)
- **Status:** **Active.** MAMP and MAMP PRO are maintained and updated.
- **Attribution confidence:** **Medium** — High for the product, uncertain whether Meyer coined the acronym itself.

### Other LAMP OS-variants (brief)

These are all community-coined, documented primarily in [this comprehensive GitHub Gist](https://gist.github.com/Potherca/9552ff58fbbb026cec425fc528457e40) and Wikipedia. All date to the 2000s. None have specific individual attributions.

| Stack | Components | Status |
|-------|-----------|--------|
| **FAMP** | FreeBSD, Apache, MySQL, PHP | Niche but active |
| **DAMP** | Darwin (macOS kernel), Apache, MySQL, PHP | Legacy |
| **BAMP** | BSD, Apache, MySQL, PHP | Legacy |
| **SAMP** | Solaris, Apache, MySQL, PHP | Deprecated (Solaris is effectively dead) |
| **OAMP** | OpenBSD, Apache, MySQL, PHP | Niche |
| **LLMP** | Linux, Lighttpd, MySQL, PHP | Legacy |

---

## II. The Microsoft counterparts

### WISA
- **Components:** **W**indows Server, **I**IS (Internet Information Services), **S**QL Server, **A**SP.NET
- **Coined by:** Community — no individual attributed. Emerged as the "Microsoft LAMP" parallel.
- **Date:** Estimated mid-**2000s.** Listed on [Wikipedia's Solution Stack page](https://en.wikipedia.org/wiki/Solution_stack) without attribution.
- **Status:** **Active but the acronym is fading.** The underlying Microsoft stack remains widely used in enterprise, but .NET is now cross-platform (runs on Linux), SQL Server runs on Linux, and Azure has partly supplanted traditional IIS hosting. The strict Windows-bound connotation is outdated.
- **Attribution confidence:** **Low.**

### WINS
- **Components:** **W**indows Server, **I**IS, **.N**ET, **S**QL Server
- **Coined by:** Community — no individual attributed. Alternative letter arrangement of essentially the same Microsoft stack as WISA, emphasizing .NET over ASP.NET specifically.
- **Date:** Mid-**2000s.**
- **Status:** Same as WISA — active stack, fading acronym.
- **Attribution confidence:** **Low.**

### WIMP
- **Components:** **W**indows, **I**IS, **M**ySQL, **P**HP/Perl/Python
- **Coined by:** Community.
- **Date:** Early **2000s.**
- **Status:** **Mostly deprecated.** The amusingly unfortunate name likely contributed to disuse.
- **Attribution confidence:** **Low.**

---

## III. The JavaScript full-stack era

The 2013–2017 wave of stacks that replaced traditional server-rendered architectures with all-JavaScript solutions.

### MEAN
- **Components:** **M**ongoDB, **E**xpress.js, **A**ngularJS, **N**ode.js
- **Coined by:** **Valeri Karpov**, Node.js engineer at MongoDB and maintainer of the Mongoose ODM. Known online as "The Code Barbarian."
- **Date:** **April 29, 2013.** Karpov published "The MEAN Stack: MongoDB, ExpressJS, AngularJS, and Node.js" on his personal blog, then as a guest post on the MongoDB blog on April 30. Key quote: *"My team uses a set of tools that we affectionately call the MEAN stack."* Confirmed in a [Google Developers Live presentation](https://speakerdeck.com) on October 3, 2013, and his [edX bio](https://www.edx.org/bio/valeri-karpov).
- **Original source:** [thecodebarbarian.com](https://thecodebarbarian.com/2013/04/29//easy-web-prototyping-with-mongodb-and-nodejs.html) and [MongoDB blog](http://blog.mongodb.org/post/49262866911/the-mean-stack-mongodb-expressjs-angularjs-and)
- **Status:** **Active but declining.** React and Vue have eclipsed Angular for new projects. The MEAN concept persists but MERN is now far more popular.
- **Attribution confidence:** **High** — one of the best-documented stack-naming origins.
- **Notes:** The **MEAN.io vs. MEAN.js fork** is a notable subplot. **Amos Haviv** (Israeli developer) built the original MEAN.io boilerplate at **Linnovate**. After a dispute, Haviv left and forked the project as MEAN.js; **Lior Kesos** retained MEAN.io. Both repositories are now largely inactive.

### MERN
- **Components:** **M**ongoDB, **E**xpress.js, **R**eact, **N**ode.js
- **Coined by:** Community — no single individual credited. Emerged organically when React surpassed Angular in popularity (~2015). The **Hashnode team** (Sandeep Panda, Syed Fazle Rahman, and others) created **mern-starter** and the mern.io site around 2015–2016, significantly popularizing and formalizing the term.
- **Date:** ~**2015–2016.** No single "coining moment" equivalent to Karpov's MEAN post.
- **Original source:** [github.com/Hashnode/mern-starter](https://github.com/Hashnode/mern-starter) (now deprecated)
- **Status:** **Very active** — arguably the most popular full-stack JavaScript combination in 2026. Dominates bootcamp curricula and startup tech stacks.
- **Attribution confidence:** **Low** on a specific individual. **High** that it was a community evolution from MEAN.
- **Notes:** ⚠️ One low-quality source falsely attributes MERN to "Brian Chesky of Airbnb." This is demonstrably incorrect.

### MEVN
- **Components:** **M**ongoDB, **E**xpress.js, **V**ue.js, **N**ode.js
- **Coined by:** Community — no individual attributed. Natural MEAN variant following Vue.js's rise.
- **Date:** ~**2016–2017.** Vue.js (released Feb 2014 by Evan You) gained significant traction around 2016.
- **Status:** **Active** but smaller community than MERN. Particularly popular in Asian developer communities where Vue has strong adoption.
- **Attribution confidence:** **Low.**

### PERN
- **Components:** **P**ostgreSQL, **E**xpress.js, **R**eact, **N**ode.js
- **Coined by:** The earliest identifiable public reference is a blog post by **"Dan"** on *Dan Dreams of Coding*, who wrote: *"And so it is with great pleasure that I present the PERN stack."* The phrasing suggests he was naming something he'd assembled rather than using an established term.
- **Date:** **July 25, 2016.** A commenter in 2018 wrote: "I Googled to see if anyone else was using Postgres instead of Mongo and lo and behold, I found this" — suggesting it was still obscure two years later.
- **Original source:** [dandreamsofcoding.com/2016/07/25/the-pern-stack/](https://dandreamsofcoding.com/2016/07/25/the-pern-stack/)
- **Status:** **Active and growing.** PostgreSQL's surge in popularity over MongoDB for projects requiring relational integrity drives adoption. FreeCodeCamp and numerous tutorials now feature it prominently.
- **Attribution confidence:** **Medium** — Dan's post is the earliest dated reference found, but the term may have existed informally earlier.

### LERN
- **Components:** **Not an established named stack.** The suggested expansion "Lerna, ESLint, React, Node" describes a tooling configuration for monorepos, not an architectural stack in the MEAN/MERN tradition.
- **Coined by:** N/A
- **Date:** N/A
- **Status:** After extensive searching across comprehensive stack listings (including a [GitHub Gist cataloguing 50+ stacks](https://gist.github.com/Potherca/9552ff58fbbb026cec425fc528457e40)), Wikipedia, dev.to, Medium, and Stack Overflow, **no evidence was found that "LERN stack" is a recognized or widely-used named technology stack.** It may be a hypothetical coinage or a misremembering.
- **Attribution confidence:** N/A — **High confidence that this is not an established stack.**

### NERD
- **Components:** **N**ode.js, **E**xpress, **R**eact, **D**atabase (generic)
- **Coined by:** **Alexander Gugel** (while at Hack Reactor)
- **Date:** ~**2014–2015.** Tagline: *"Hipsterer than MEAN stack."*
- **Original source:** [alexandergugel.svbtle.com](https://alexandergugel.svbtle.com/introducing-the-nerd-stack) and [github.com/Xantier/nerd-stack](https://github.com/Xantier/nerd-stack)
- **Status:** **Niche/legacy.** Small community adoption.
- **Attribution confidence:** **Medium.**

---

## IV. Modern full-stack architectures

Stacks that emerged from the JAMstack era onward, reflecting new architectural paradigms.

### JAMstack / Jamstack
- **Components:** **J**avaScript, **A**PIs, **M**arkup
- **Coined by:** **Mathias (Matt) Biilmann**, co-founder and CEO of Netlify, with co-founder **Chris Bach**. Biilmann has confirmed this in multiple podcast interviews: *"I obviously at some point coined this whole 'Jamstack' term... How about JAMstack for JavaScript APIs and markup? And they were like, 'Yeah, that works.'"*
- **Date:** Coined internally at Netlify in **2015**. First public presentation at **SmashingConf San Francisco, April 6, 2016**, in a talk titled "The New Front-End Stack: JavaScript, APIs, and Markup."
- **Original sources:** [Speaker Deck slides (April 6, 2016)](https://speakerdeck.com/biilmann/the-jam-stack), [SmashingConf speaker page](https://archive.smashingconf.com/sf-2016/speakers/mathias-biilman.html), [JAMstack Radio origin story podcast](https://www.heavybit.com/library/podcasts/jamstack-radio/ep-2-the-jamstack-origin-story)
- **Status:** **Active but evolving.** Around 2020, the capitalization changed from "JAMstack" to "Jamstack" to signal it had evolved beyond specific technologies into a broader architectural pattern. By ~2023, Netlify began positioning "composable architecture" as the next step beyond Jamstack.
- **Attribution confidence:** **High** — Biilmann confirms coinage in recorded interviews.

### T3 Stack
- **Components:** **Next.js**, **TypeScript**, **Tailwind CSS**, **tRPC**, **Prisma**, **NextAuth.js** (modular; only Next.js and TypeScript are mandatory). The "T3" name comes from Theo's online handle (t3dotgg / t3.gg), not from the component initials.
- **Coined by:** **Theo Browne** (known as t3dotgg), software engineer, YouTuber, and CEO of Ping Labs (T3 Chat). Previously worked at Twitch.
- **Date:** **May 2022.** The `create-t3-app` CLI tool was built by **Shoubhit Dash** (nexxeln), a then-17-year-old community member who created it after Theo mentioned on stream that it would be convenient. The original stack reference was at `init.tips`.
- **Original sources:** [create.t3.gg](https://create.t3.gg/en/introduction), [github.com/t3-oss/create-t3-app](https://github.com/t3-oss/create-t3-app), [dev.to post by nexxeln](https://dev.to/nexxeln/t3-stack-and-my-most-popular-open-source-project-ever-5c31)
- **Status:** **Very active.** Significant GitHub stars, active contributors, and T3 Chat itself is built on the stack.
- **Attribution confidence:** **High.**

### TALL
- **Components:** **T**ailwind CSS, **A**lpine.js, **L**aravel, **L**ivewire
- **Coined by:** Emerged from the Laravel community. The [tallstack.dev](https://tallstack.dev/about) about page credits three people: **Caleb Porzio** (creator of both Alpine.js and Livewire), **Matt Stauffer** (owner of Tighten), and **Tony Lea** (creator of DevDojo). Porzio is the most likely originator given he created two of the four components, but no single definitive "first use" tweet or post was found.
- **Date:** ~**mid-2020.** Alpine.js matured in late 2019/early 2020, Livewire v1 launched early 2020. The earliest DevDojo tutorial was published **July 12, 2020**. The `laravel-frontend-presets/tall` GitHub package also dates to 2020.
- **Original source:** [tallstack.dev](https://tallstack.dev/), [DevDojo tutorial (July 2020)](https://devdojo.com/post/tnylea/building-apps-with-the-tall-stack)
- **Status:** **Very active.** Livewire 4 announced 2025. A primary way to build modern Laravel applications.
- **Attribution confidence:** **Medium** — collectively credited; no single documented coiner.

### VILT
- **Components:** **V**ue.js, **I**nertia.js, **L**aravel, **T**ailwind CSS
- **Coined by:** A blog post by Elliot Taylor mentions: *"VILT translates to WILD in Scandinavian languages (hat tip to Juhlin for that name)."* This suggests someone named **Juhlin** coined the name, but no full name or further identifying information was found. Inertia.js was created by **Jonathan Reinink**.
- **Date:** ~**2020.** The [skydiver/vilt-stack](https://github.com/skydiver/vilt-stack) GitHub repo uses Laravel 7, placing it around early 2020. A companion site exists at viltstack.dev.
- **Status:** **Active** in the Laravel ecosystem. Competes with TALL for mindshare. Laravel Breeze and Jetstream support this combination natively.
- **Attribution confidence:** **Low** — "Juhlin" attribution comes from a single blog post.

---

## V. The HTMX renaissance

A wave of stacks built around **HTMX** (created by Carson Gross), reflecting a return to server-rendered hypermedia architectures.

### BETH
- **Components:** **B**un, **E**lysia, **T**urso, **H**TMX
- **Coined by:** **Ethan Niser**, software engineer (now at Vercel, previously CS student at University of Florida).
- **Date:** ~**July 2023.** Niser posted a [tweet on ~July 18, 2023](https://twitter.com/ethanniser/status/1681435700342800384) and created a YouTube video titled "The BETH Stack: Build Hypermedia Driven Web Apps."
- **Original source:** [github.com/ethanniser/the-beth-stack](https://github.com/ethanniser/the-beth-stack), described as "An opinionated hypermedia-driven architecture for building web apps."
- **Status:** **Niche but active.** More educational/demonstration than enterprise standard. Niser has since shifted focus to other projects at Vercel.
- **Attribution confidence:** **High.**

### GoTH
- **Components:** **Go**, **T**empl, **H**TMX (sometimes includes Tailwind CSS)
- **Coined by:** Attributed to **ThePrimeagen** (Michael Paulson), popular tech YouTuber/streamer. One source states: *"The Primeagen created the beautiful name GOTH Stack for using Go + templ + HTMX."*
- **Date:** ~**2023–2024.**
- **Original source:** [davidcaudill.dev](https://davidcaudill.dev/delving-into-the-goth-stack.html)
- **Status:** **Active niche** in the Go community.
- **Attribution confidence:** **Medium** — single attribution source.

### PyHAT
- **Components:** **Py**thon, **H**TMX, **A**SGI, **T**ailwind CSS (any ASGI framework, especially Django)
- **Coined by:** **Mario Munoz** (@tataraba / "Python By Night") and **Benjamin Kirkbride**, who established the concept and awesome-list at PyCon US 2023 in Salt Lake City.
- **Date:** **April–May 2023** (PyCon US 2023).
- **Original source:** [pythonbynight.com](https://pythonbynight.com/blog/awesome-python-htmx) and [github.com/PyHAT-stack/awesome-python-htmx](https://github.com/PyHAT-stack/awesome-python-htmx)
- **Status:** **Active community initiative**, especially in the Django ecosystem.
- **Attribution confidence:** **High.**

---

## VI. Database-centric and API-centric stacks

### GRAND Stack
- **Components:** **G**raphQL, **R**eact, **A**pollo, **N**eo4j **D**atabase
- **Coined by:** **William Lyon**, Staff Developer Advocate at Neo4j. He created the concept, wrote the definitive book *Full Stack GraphQL Applications* (Manning), and maintained the neo4j-graphql.js library.
- **Date:** **October 2017**, announced at **GraphQL Summit 2017.** Neo4j's blog stated: *"We're happy to announce the launch of GRANDstack just in time for GraphQL Summit."*
- **Original source:** [Neo4j blog announcement](https://neo4j.com/blog/news/neo4j-grandstack-graphql-summit/), [github.com/grand-stack](https://github.com/grand-stack), [lyonwj.com](https://lyonwj.com)
- **Status:** **Legacy/dormant** as a named stack. The GitHub repos have minimal recent activity. Individual technologies remain active, but the unified branding has faded.
- **Attribution confidence:** **High.**

### FARM
- **Components:** **F**astAPI, **R**eact, **M**ongoDB
- **Coined by:** Popularized by the **MongoDB Developer Blog** and the book *Full Stack FastAPI, React, and MongoDB* by **Marko Aleksendrić** (Packt, 2023). No single originator identified.
- **Date:** ~**2021–2022.**
- **Original source:** [MongoDB developer blog](https://www.mongodb.com/developer/languages/python/farm-stack-fastapi-react-mongodb/)
- **Status:** **Active and growing.** FastAPI is one of the fastest-growing Python frameworks.
- **Attribution confidence:** **Low** on specific coiner.

### FReMP
- **Components:** **F**lask, **R**eactJS, **M**ongoDB, **P**ython
- **Coined by:** Community; promoted by developer **Kouul** on DEV Community.
- **Date:** ~**2020.**
- **Original source:** [dev.to/kouul/frmp-stack-5g9](https://dev.to/kouul/frmp-stack-5g9)
- **Status:** **Niche.**
- **Attribution confidence:** **Low.**

### FERN
- **Components:** **F**irebase, **E**xpress, **R**eact, **N**ode.js
- **Coined by:** Community; popularized through multiple dev blog posts.
- **Date:** ~**2019–2020.**
- **Original source:** [dev.to discussions](https://dev.to/rush/mern-mean-or-fern-stack-4nli)
- **Status:** **Active** for real-time apps and rapid prototyping.
- **Attribution confidence:** **Low.**

---

## VII. Observability and operations stacks

### ELK Stack
- **Components:** **E**lasticsearch, **L**ogstash, **K**ibana
- **Coined by:** Community — no single individual. The three tools converged when their creators joined forces: **Shay Banon** (Elasticsearch, 2010), **Jordan Sissel** (Logstash, 2009), and **Rashid Khan** (Kibana, 2011). Khan joined Elasticsearch BV in January 2013; Sissel joined in August 2013. The "ELK" acronym crystallized around this time.
- **Date:** ~**2013.** By the March 2015 [company rename](https://www.elastic.co/about/press/elasticsearch-changes-name-to-elastic-to-reflect-wide-adoption-beyond-search) from "Elasticsearch" to "Elastic," "the ELK stack" was already referenced as an established term. In **February 2016**, Elastic officially introduced **"Elastic Stack"** branding to accommodate **Beats** (the fourth component), noting: *"We just couldn't figure out how to make the 'B' work with the E-L-K combination."*
- **Status:** **Very active.** Now officially "Elastic Stack" but "ELK" remains the colloquial term. Used by Netflix, eBay, Goldman Sachs, and thousands of organizations.
- **Attribution confidence:** **Low** on the specific acronym's origin — community-emergent.
- **Notes:** In January 2021, Elastic changed licensing from Apache 2.0 to SSPL/Elastic License, prompting AWS to fork the project as **OpenSearch**. In August 2024, AGPL was added back as an open-source option.

### TICK Stack
- **Components:** **T**elegraf, **I**nfluxDB, **C**hronograf, **K**apacitor
- **Coined by:** **Paul Dix**, co-founder and CTO of **InfluxData** (originally Errplane). All four components were developed by InfluxData. This is a corporate-coined stack for their own product suite, not a community-emergent term.
- **Date:** ~**2015–2016.** The company rebranded from Errplane to InfluxData in late 2015. A [January 2016 PR announcement](https://www.prweb.com/releases/influxdata_announces_change_in_executive_leadership/prweb13164956.htm) references the "TICK Stack" as an established term.
- **Original source:** [InfluxData blog](https://www.influxdata.com/blog/introduction-to-influxdatas-influxdb-and-tick-stack/), [Paul Dix's Speaker Deck](https://speakerdeck.com/pauldix/time-series-and-monitoring-with-influxdb-and-the-tick-stack)
- **Status:** **Partially deprecated as a four-component stack.** InfluxDB 2.0+ absorbed Chronograf (UI) and Kapacitor (alerting) into the core database. InfluxDB 3.0 (2023–2025 rewrite in Rust) represents the current direction. Telegraf continues as a standalone agent. The InfluxData community forum itself has a thread titled *"What in the TICK Stack is actually still needed?"*
- **Attribution confidence:** **High.**

---

## VIII. Big data stacks

### SMACK
- **Components:** **S**park, **M**esos, **A**kka, **C**assandra, **K**afka
- **Coined by:** **Oliver White**, Chief Storyteller at Typesafe/Lightbend. According to **Alexy Khrabrov** (organizer of Scala By the Bay), who provides a [detailed first-person account](https://chiefscientist.org/a-brief-history-of-the-smack-stack-f382547e91fe): *"I've first seen the phrase SMACK Stack in a tweet by Jamie Allen, attributed to Oliver White, on June 25, 2015."* Khrabrov then organized the first end-to-end SMACK Stack training at Big Data Scala / Scala By the Bay 2015. **Mesosphere** subsequently commercialized it through their DCOS Infinity product.
- **Date:** **June 25, 2015** (first known tweet). First training: **August 2015.** O'Reilly published [an article](https://www.oreilly.com/radar/the-smack-stack/) in 2016. Multiple books followed (Springer/Apress, Packt).
- **Status:** **Largely legacy/deprecated as a unified stack.** Apache Mesos was moved to the Apache Attic (deprecated) in 2021. Akka changed to a BSL (non-open-source) license in 2022. Kubernetes replaced Mesos. Individual components (Spark, Cassandra, Kafka) remain very active, but the "SMACK" brand is dead.
- **Attribution confidence:** **Medium** — White is credited by Khrabrov's detailed account; the attribution chain is White coined → Khrabrov materialized → Mesosphere productized.

---

## IX. Language-specific ecosystem stacks

### PETAL (Elixir)
- **Components:** **P**hoenix, **E**lixir, **T**ailwind CSS, **A**lpine.js, **L**iveView
- **Coined by:** **Patrick Thompson**, popularized on the **Thinking Elixir Podcast** and later endorsed by Chris McCord (Phoenix/LiveView creator).
- **Date:** **November 2020.**
- **Original source:** [Thinking Elixir](https://thinkingelixir.com/petal-stack-in-elixir/), [Changelog](https://changelog.com/posts/petal-the-end-to-end-web-stack)
- **Status:** **Active** — the go-to Elixir full-stack pattern. There is ongoing discussion about dropping Alpine.js as LiveView matures (see [Fly.io: "Plucking the A from PETAL"](https://fly.io/phoenix-files/plucking-the-a-from-petal/)).
- **Attribution confidence:** **High.**

### SAFE (F#/.NET)
- **Components:** **S**aturn (originally Suave), **A**zure, **F**able, **E**lmish
- **Coined by:** **Isaac Abraham** of **Compositional IT** (UK).
- **Date:** ~**2017.** Original proposal mentioned Suave; Saturn replaced Suave later.
- **Original source:** [safe-stack.github.io](https://safe-stack.github.io/), [Compositional IT blog](https://www.compositional-it.com/news-blog/the-journey-to-safe-stack-v3/), [Scott Hanselman's blog](https://www.hanselman.com/blog/learning-about-the-f-safe-stack-suaveio-azure-fable-elmish)
- **Status:** **Active** — the primary F# full-stack web development framework, now on v3.
- **Attribution confidence:** **High.**

### LYME (Erlang)
- **Components:** **L**inux, **Y**aws, **M**nesia, **E**rlang
- **Coined by:** First appeared on the **Erlang mailing list** in **January 2006**, in a message responding to Joe Armstrong (creator of Erlang). The user wrote: *"Turn off the LAMP; have a LYME."* (Specific mailing list poster not identified by full name.)
- **Date:** **January 2006.**
- **Original source:** [Erlang mailing list archive](http://erlang.org/pipermail/erlang-questions/2006-January/018742.html)
- **Status:** **Legacy/historical.** Mostly superseded by the Elixir/Phoenix ecosystem. Notably, **Klarna** (Swedish fintech, originally Kreditor) built their platform on LYME.
- **Attribution confidence:** **Medium** — mailing list post is documented, but the poster's identity is only partially known.
- **Notes:** Variant **LYCE** (Linux, Yaws, **CouchDB**, Erlang) emerged ~2007 when CouchDB replaced Mnesia.

### GLASS (Smalltalk)
- **Components:** **G**emStone/S, **L**inux, **A**pache, **S**easide, **S**malltalk
- **Coined by:** **James Foster** and **Dale Henrichs** of GemStone Systems.
- **Date:** **2007.** Announced at Smalltalk Solutions conference; introductory blog post May 6, 2007.
- **Original source:** [GemStone Soup blog (May 6, 2007)](https://gemstonesoup.wordpress.com/2007/05/06/hello-world/), [github.com/glassdb](https://github.com/glassdb)
- **Status:** **Legacy/niche.** Folded into the GsDevKit open-source project. Still maintained by GemTalk Systems but very small community.
- **Attribution confidence:** **High.**

### BCHS (pronounced "beaches")
- **Components:** **B**SD (OpenBSD), **C**, **h**ttpd, **S**QLite
- **Coined by:** **Kristaps Dzonsons** (creator of mandoc, known for minimalist systems programming).
- **Date:** ~**2016–2017.** The learnbchs.org site launched around this time.
- **Original source:** [learnbchs.org](https://learnbchs.org/index.html), [Hacker News discussion](https://news.ycombinator.com/item?id=14580746)
- **Status:** **Active niche** — intentionally minimalist and contrarian. Tagline: *"Software development is full of jokes. This is not one of them."*
- **Attribution confidence:** **High.**

---

## X. Cloud-native and emerging stacks

### PLONK
- **Components:** **P**rometheus, **L**inkerd, **O**penFaaS, **N**ATS, **K**ubernetes
- **Coined by:** **Alex Ellis**, creator of OpenFaaS.
- **Date:** ~**2019.**
- **Status:** **Niche but active** in the cloud-native/serverless community. The name is amusingly British slang for cheap wine.
- **Attribution confidence:** **Medium.**

### PARK (emerging)
- **Components:** **P**ostgreSQL, **A**I (specifically Ray), **R**eact, **K**ubernetes
- **Coined by:** Proposed in an **O'Reilly Media** article (by Ben Lorica and others).
- **Date:** **2025–2026** — very recent.
- **Original source:** [O'Reilly Radar](https://www.oreilly.com/radar/what-is-the-park-stack/)
- **Status:** **Emerging** — proposed as a modern successor to LAMP for the AI era.
- **Attribution confidence:** **Medium.**

---

## XI. Cross-reference table

| Stack | Components | Coined by | Year | Status | Confidence |
|-------|-----------|-----------|------|--------|------------|
| **LAMP** | Linux, Apache, MySQL, PHP | Michael Kunze | 1998 | Active | High |
| **LEMP** | Linux, Nginx, MySQL, PHP | Community | ~2008 | Active | Low |
| **LAPP** | Linux, Apache, PostgreSQL, PHP | Community | ~2000s | Active | Low |
| **WAMP** | Windows, Apache, MySQL, PHP | Community / Romain Bourdon (WampServer) | ~2000 / 2003 | Active | Low / High |
| **XAMPP** | X-platform, Apache, MariaDB, PHP, Perl | Kai Seidler & Kay Vogelgesang | 2002 | Slowing | High |
| **MAMP** | macOS, Apache, MySQL, PHP | Holger Meyer (product) | 2005 | Active | Medium |
| **WISA** | Windows, IIS, SQL Server, ASP.NET | Community | ~2005 | Active (fading name) | Low |
| **WINS** | Windows, IIS, .NET, SQL Server | Community | ~2005 | Active (fading name) | Low |
| **MEAN** | MongoDB, Express, Angular, Node | Valeri Karpov | Apr 2013 | Active (declining) | High |
| **MERN** | MongoDB, Express, React, Node | Community / Hashnode | ~2015 | Very active | Low |
| **MEVN** | MongoDB, Express, Vue.js, Node | Community | ~2016 | Active | Low |
| **PERN** | PostgreSQL, Express, React, Node | "Dan" (dandreamsofcoding) | Jul 2016 | Growing | Medium |
| **LERN** | *(Not an established stack)* | N/A | N/A | N/A | N/A |
| **JAMstack** | JavaScript, APIs, Markup | Mathias Biilmann (Netlify) | 2015/2016 | Active (evolving) | High |
| **T3** | Next.js, TypeScript, Tailwind, tRPC, Prisma, NextAuth | Theo Browne | May 2022 | Very active | High |
| **TALL** | Tailwind, Alpine.js, Laravel, Livewire | Porzio / Stauffer / Lea | ~2020 | Very active | Medium |
| **VILT** | Vue, Inertia.js, Laravel, Tailwind | "Juhlin" (attributed) | ~2020 | Active | Low |
| **GRAND** | GraphQL, React, Apollo, Neo4j DB | William Lyon (Neo4j) | Oct 2017 | Legacy/dormant | High |
| **BETH** | Bun, Elysia, Turso, HTMX | Ethan Niser | Jul 2023 | Niche | High |
| **GoTH** | Go, Templ, HTMX | ThePrimeagen (attributed) | ~2023 | Active niche | Medium |
| **PyHAT** | Python, HTMX, ASGI, Tailwind | Mario Munoz & Benjamin Kirkbride | Apr 2023 | Active | High |
| **ELK** | Elasticsearch, Logstash, Kibana | Community / Elastic | ~2013 | Very active | Low |
| **TICK** | Telegraf, InfluxDB, Chronograf, Kapacitor | Paul Dix / InfluxData | ~2015 | Partially deprecated | High |
| **SMACK** | Spark, Mesos, Akka, Cassandra, Kafka | Oliver White (Typesafe) | Jun 2015 | Legacy | Medium |
| **PETAL** | Phoenix, Elixir, Tailwind, Alpine.js, LiveView | Patrick Thompson | Nov 2020 | Active | High |
| **SAFE** | Saturn, Azure, Fable, Elmish | Isaac Abraham | ~2017 | Active | High |
| **LYME** | Linux, Yaws, Mnesia, Erlang | Erlang mailing list user | Jan 2006 | Legacy | Medium |
| **GLASS** | GemStone/S, Linux, Apache, Seaside, Smalltalk | James Foster & Dale Henrichs | 2007 | Legacy/niche | High |
| **BCHS** | BSD, C, httpd, SQLite | Kristaps Dzonsons | ~2016 | Active niche | High |
| **FARM** | FastAPI, React, MongoDB | Community / MongoDB blog | ~2021 | Growing | Low |
| **FERN** | Firebase, Express, React, Node | Community | ~2019 | Active | Low |
| **NERD** | Node, Express, React, Database | Alexander Gugel | ~2014 | Niche/legacy | Medium |
| **PLONK** | Prometheus, Linkerd, OpenFaaS, NATS, K8s | Alex Ellis | ~2019 | Niche | Medium |
| **PARK** | PostgreSQL, AI/Ray, React, Kubernetes | O'Reilly Media | 2025 | Emerging | Medium |
| **WIMP** | Windows, IIS, MySQL, PHP | Community | ~2000s | Deprecated | Low |

---

## What the history tells us

**Stack naming peaked between 2013 and 2021** during the JavaScript framework explosion, then tapered as the industry moved toward more flexible, à la carte tool selection. The pattern is clear: LAMP (1998) established the template, MEAN (2013) translated it to the JavaScript era, and everything since has been variations on the same formula — swap a component, get a new acronym.

**Most stacks are not coined by a single person.** Of the 35+ stacks documented here, only about a dozen have confident individual attributions. The rest emerged organically as communities recognized they were all using the same combination. The notable exceptions — Kunze (LAMP), Karpov (MEAN), Biilmann (JAMstack), Browne (T3) — tend to be people who deliberately branded a pattern they saw emerging, often for marketing or community-building purposes.

**The acronym-as-brand is losing steam.** Recent trends favor named tools (like `create-t3-app`) or architectural patterns (like "composable architecture") over catchy four-letter acronyms. The HTMX-based stacks (BETH, GoTH, PyHAT) represent perhaps the last wave of earnest stack naming, while **PARK** (2025) attempts to restart the tradition for the AI era. Whether developers adopt it with the same enthusiasm they had for LAMP and MEAN remains to be seen.

**A final irony:** Michael Kunze crafted "LAMP" as a deliberate marketing acronym for open-source software. Twenty-eight years later, the tradition he started has become one of the most durable memes in software engineering — outlasting many of the technologies the acronyms were meant to describe.