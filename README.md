# DeSoBook (vanilla JS)
Following feed + submit post with up to 5 images.

## Kako pokrenuti
1) Raspakiraj ZIP
2) Pokreni statični server (primjer):
   - `python -m http.server 8080`
3) Otvori `http://localhost:8080`

## Što radi
- Login preko deso-protocol SDK (identity.login) — isti login pristup kao u tvom working app.js s `accessLevelRequest=4`
- Following feed preko `/api/v0/get-posts-stateless` s `GetPostsForFollowFeed: true`
- Upload slika preko `/api/v0/upload-image` (traži JWT)
- Submit post:
  1) `/api/v0/submit-post` (dobiješ TransactionHex)
  2) Identity iFrame `sign` (dobiješ signedTransactionHex)
  3) `/api/v0/submit-transaction` (broadcast)

## Napomene
- Max 5 slika, svaka < 10 MB (gif/jpeg/png/webp)
- Ako browser (npr. Safari/iOS) traži storage access, Identity iframe može iskočiti — tapni u njega da otključa wallet pa ponovi akciju.


## Login napomena
Ova verzija koristi `deso-protocol` (`identity.login()`), isti stil kao u tvom priloženom app.js koji radi. fileciteturn1file15


## Novi feature-i
- Edit profile (username/bio/avatar) preko `/api/v0/update-profile`
- Like/Unlike (create-like-stateless)
- Comment (submit-post + ParentStakeID)
- Repost (submit-post + RepostedPostHashHex)
- Diamonds (send-diamonds)
- Menu routing + Profile view (get-posts-for-public-key)


## Fix za Like/Diamond (Derived Key permissions)
Ako dobiješ grešku `RuleErrorDerivedKeyTxnTypeNotAuthorized` ili `No more transactions of type BASIC_TRANSFER`, znači da tvoj derived key nema dopuštenja za LIKE ili BASIC_TRANSFER. Diamonds su BASIC_TRANSFER (s dodatnim metadata). citeturn0search7
Ova verzija koristi novi appName **DeSoBook Actions +Profile** i traži dozvole za: BASIC_TRANSFER, LIKE, SUBMIT_POST, FOLLOW, UPDATE_PROFILE.


## Following sidebar
- Desna strana prikazuje listu profila koje pratiš (max 50) preko `/api/v0/get-follows-stateless`.


## Fix (Following list)
Neki node-ovi vraćaju mapu `PublicKeyToProfileEntry` (legacy shape) umjesto `Follows`. Ova verzija parsira oba oblika i radi fallback poziv ako `GetEntriesFollowingUsername=true` vrati prazno.


## Poboljšanja
- Following 'Open' sada otvara profil unutar aplikacije (Profile view), ne novi tab.
- Popravljen CSS da 'Open' gumb ne izlazi iz okvira.


## Promjene
1) Username na svim postovima: dodan username cache + async resolve po public key.
2) Following search: input koji traži preko `/api/v0/get-profiles` (50 results) umjesto da loada 1000.
3) Info page: u Profile headeru dodan gumb Info koji otvara User info view (get-single-profile).


## Trending: Recent posts
Trending card sada prikazuje 3 recent posta (global feed → default → follow feed fallback). Klik na item otvara profil autora unutar aplikacije.


## Fix (Recent posts ordering)
Recent posts sada primarno koristi `/api/v0/get-hot-feed` (HotFeedPage) da dobije aktualne postove, jer global feed moze sadrzavati stare curated postove. Fallback: get-posts-stateless default -> follow feed.


## Trending hashtags + filter
- Trending hashtags se računaju iz Hot feed (50 postova) i prikazuju top 5-6 tagova.
- Klik na tag filtrira Home feed (client-side) i prikazuje Filter pill s Clear gumbom.


## Groups (Option A)
Added Groups (no server) using GroupId in PostExtraData.


## Groups: Share + Pin
- Share: copies a link with group params in URL hash, auto-imports on open.
- Pin: locally pin a post per group; pinned shows at top.
