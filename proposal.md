# "Hop Stop" Proposal

## Group Members 
- Nick Hughes 

## Overview

Inspired by my constant "breweries near me" searches on Google, *Hop
Stop* (tentative name), on an extremely high level, is a
location-based search and social application that beer-lovers can use
to find, rate, save, and share breweries. The goal is to take the
features that myself and others like me use on Google Maps, like a map
display with matching nearest-first results, and build a social
network on top of them that encourages brewery-goers to connect with
new breweries and each other. As a result, users can expand their beer
horizons while smaller breweries increase their customer bases.

### Shortcomings of Google Maps for This Use Case

While Google Maps does feature ratings and comments on individual
places, it is severely hurt by a sort of "pollution" in these areas.
On most Google Maps listings, most ratings and comments are made by
"Local Guides" (the tag can be seen just under the user's name), whom
are rewarded by Google by quantity of Maps contributions (rewards can
include subscriptions to Google services, movie tickets, etc.). While
this seems like a great way to promote a strong basis of crowdsourced
data, in reality it's created an ecosystem where bad actors are
rewarded for copy-pasting the same review to many different places
they've never even visited, thus [discrediting Maps reviews as a
whole](https://searchengineland.com/good-guides-gone-bad-how-googles-local-guides-program-fails-businesses-and-consumers-326724).
There are obviously exceptions, and Google must be working to mitigate
the issue, but overall the need for a targeted, trustworthy platform
is evident.

### Features

**Searching**  
Users should be able to search for breweries by location (either their
current location or a specified one) and filter and sort as they
please. They will then be able to infinitely scroll to view
continuously less relevant results.

**Rating, Commenting, and Favoriting**  
On a brewery's dedicated page, users can leave star ratings and
comments to share their thoughts with other users. They can also see
the ratings and comments of other users. Users can also mark breweries
as favorites to make them easier to find for themselves and their
friends.

**Social**  
Users will be able to add each other as friends by email. When
filtering by favorites on the search page, they should be able to see
their own favorites as well as their friends' favorites (the UI will
denote whose favorite each result is). If a user is visiting a
brewery, they can also share that in real-time to either all or a
subset of their friends. This is presented to the friends as a
notification, so they can go meet the sender at that brewery if they
want (call these "Meet Me Here" requests).

## Technical Details

*Hop Stop* will be implemented as two separate repositories. The first
repository will be a Phoenix-driven backend written in Elixir, which
exposes a JSON API for carrying out all of the app functions described
above. It will communicate with an external API that provides data on
breweries, as well as a Postgres database represented as Ecto
resources to manage other persistent state. The other repository will
be a single-page frontend application written with React that will
communicate with the backend's JSON API through AJAX calls. It will
also need to use a few other frameworks to support geolocation and map
views.

### API

The API that has been chosen for *Hop Stop* is **Open Brewery DB**, a
free key-authenticated API that exposes a series of endpoints
dedicated to getting instances of a single resource: breweries. The
API features an extensive dataset of breweries in the United States
that includes website URLs, phone numbers, addresses, etc. This data
is more than enough to populate the dedicated brewery pages along with
rating and other social data. The API also features the exact
coordinates of breweries, which will be helpful for searching and
displaying them in a map view.

#### Shortcomings

While the API has all of the data we need, the actual endpoints and
available query options are limited. For example, even though
coordinates are part of the dataset there is no way to query by them,
and there is no way to query for a series of ids rather than a single
one, so getting a set of favorites might need to be represented as a
series of queries rather than one.

To overcome these issues, there is an option I have explored:
contacting the developer. He has a dedicated Discord server for the
API where developers can suggest new features, which I've already
done. The shortcomings described above are easy to fix since they are
not data issues, so I hope to see them fixed in the next week or two.
Additionally, there are workarounds for the lack of coordinate-based
querying which will be detailed in the Experiments section.

### Realtime Behavior

The bulk of realtime features in this project relates to social
functions and Phoenix Channels. First, when a user adds another user
as a friend, the receiver of the friend request will immediately
receive it through a Phoenix Channel. Additionally, if a user chooses
to share that he/she is currently at a brewery with friends, all of
the chosen friends will immediately be notified through a Phoenix
Channel.

### Persistent State

*Hop Stop*'s persistent state will be stored in a series of Postres
tables, represented as Ecto resources in the backend Elixir code.

`Users` will contain identifying information such as `email` +
`password_hash` combinations, along with profile photos and bios.

`Friends` will be a join table that links a `friender` (sent the
request) and `friendee` (received the request), along with a flag
representing whether or not the request was accepted. A given `User`
will have a property `friends`, which will be derived by finding all
`Friend` records where either entry is that user, and the flag is set
to `true`. Entries with a `null` flag will be displayed as
notifications to the `friendee`.

`Favorites` will be another join table that links a `User` to a
`brewery_id`, which represents the `id` to query the API for
(breweries themselves will not be represented in the Postgres table).
The constraint of one `Favorite` per `User` per `brewery_id` will have
to be enforced. The use case for this resource will likely be to
compile all `brewery_id` entries for a `User` and all of his
`friends`, then get them from **Open Brewery DB**.

`Ratings` will represent star ratings on breweries, enforcing 1
`Rating` per `User` per `brewery_id`. The specific properties of this
resource are exactly the same as `Favorites`, but with an additional
field `stars` that is an integer between 0 and 5. Brewery pages will
display a total average of ratings and specifically feature ratings by
friends.

`Comments` will represent comments by `Users` on breweries. Each
`Comment` will have an associated `User` and `brewery_id`, as well as
a text field `body` containing the contents of the comment.

*Note: it is extremely likely that `Comments` and `Ratings` will be
consolidated to a single table similar to most rating systems.* 

`MeetMeHeres` will be a notification-type resource representing the
"Meet Me Here" requests defined above. Since a `User` can send these
requests to any or all of his/her `friends`, there will need to be
many instances of this resource created at once. Each instance will
contain references to a `User` and his/her `Friend` being requested,
as well as a `brewery_id` and a `timestamp`. These requests will
expire after an arbitrary time (1 or 2 hours), or when they are
dismissed.

### "Neat" Feature - Location, Reverse Geocoding, and Mapping

To get the current location of users, the React frontend application
will get user coordinates through the HTML5 location JS API. These
coordinates will then be sent to the backend to query for breweries.
If the user declines to provide his/her location or is using an
incompatible browser, he/she can provide a location manually.

Once the backend receives the coordinates, an intermediate action
needs to be taken before querying **Open Brewery DB** since it only
supports querying by postal code, city, or state. We will use
MapQuest's Reverse Geocoding API, which converts coordinates to
address components given an API key, including all queryable location
parameters. While this is a "neat" feature, ideally it will be removed
if the **Open Brewery DB** developer implements new query options.

Once the frontend receives a list of breweries in return, it will
display them as both a list and as markers on a map, which will be
displayed using the Google Maps JS API (also requires an API key).
Each brewery having coordinates will facilitate creating and
displaying these markers on the map.

### Experiments

Since *Hop Stop* makes use of four different APIs, three of which
require authentication, two experiments were done to verify the
viability of the geolocation/search flow.

Both experiments were done in this repo, which contains a generated
Phoenix application with a React frontend. They are not linked in any
way, nor are they representative of what the final project structure
will look like.

Sample output images for both experiments are found in
`./sample_output/`.

**Experiment 1: User Location and Mapping**

The goal of this experiment was to test the HTML5 Location API and the
Google Maps API in React. The relevant React components used for
testing in the browser are located in `./assets/js/app.js`.

First, after consulting Location API documentation located
[here](https://www.w3schools.com/html/html5_geolocation.asp), React
Component `LocationDemo` was created. The component gets the user's
location, if possible, by calling
`navigator.geolocation.getCurrentPosition` in the `useEffect` hook,
then displays the resulting coordinates to the user, along with a
button to turn those coordinates into a map. Sample output for this
portion can be seen in `./sample_output/exp1_a.png`.

When the button is clicked, a Google Map is displayed to the user,
which is gotten through the Google Maps JS API and the API key. To
make this process easier, an `npm` module specific for this use case
(Google Maps in React), `google-map-react` was installed and imported.
The map is centered on the current location, and an additional point
is marked nearby just to show that we can successfully display
multiple markers. Sample output for this portion can be seen in
`./sample_output/exp1_b.png`.

Since these React components make up the frontend of this particular
Phoenix repo, `mix phx.server` was executed to run the server and
access the page by navigating to `localhost:4000` in a browser. The
Maps API Key was hardcoded and omitted from this repository, as
webpack makes it difficult to use environment variables (this will not
be an issue later on as the repositories will be separate).

In the end, the test flow worked just as described. Therefore, this
experiment was successful, and it has confirmed that the frontend
location components of *Hop Stop* will be easily implemented given
this existing code as a template.

From this experiment, not only did I learn how to utilize HTML5's
location API, which is useful for limitless use cases, but also how to
use the Google Maps API and get around its edge cases (such as needing
an explicit height and width attribute to see the map).

**Experiment 2: Reverse Geocoding and Brewery API Calls**

The goal of this second experiment was to confirm that the backend
portions of the location-based brewery search will be able to be
implemented. As described above, once the user's coordinates are
gotten by the HTML5 Location API, they will be sent to the backend to
be converted to a list of nearby breweries. To accomplish this, there
are a couple components that are included in this experiment: reverse
geocoding to convert coordinates into postal code, city, and state,
and a paginated query algorithm that expands query bounds when results
are exhausted. The code related to this experiment is found in the
`HopStop.SearchByLocation` module, located in
`./lib/hop_stop/search.ex`.

To complete this experiment, coordinates first have to be reverse
geocoded to get address components. MapQuest's Reverse Geocoding API
was used (with an API key) to do so. Once the address components are
returned by the API, they must be converted into values that can be
provided to **Open Brewery DB**. Postal code and city are easy, but
the state is returned as an abbreviation when queries require the full
state name. A hard-coded map of abbreviations and state names was used
for this conversion.

Next, the query itself has to be constructed. Starting on page 1 and
inserting all address components into the query, the first request is
made and decoded. Then, if the number of results is less than 10
(results per page), then we remove the first query constraint (postal
code, then city, then state), and query again. Finally, the current
query string and page number are returned along with results. If we
use that output to query again, it will use the same logic to get the
next page.

The only problem with this approach is that duplicates become common,
and this is difficult to resolve as the server only knows one page of
results at a time. To resolve this, the frontend will need to manually
dedupe by `brewery_id` at the cost of inconsistent infinite scroll
page sizes. The location constraint expansion strategy may be able to
be omitted entirely as well if the API developer makes my suggested
changes.

The module `HopStop.SearchByLocation` was tested in interactive elixir
using the comment `MAPQUEST_API_KEY=#{MapQuest API key}
BREWERY_API_KEY=#{Open Brewery DB API key} iex -S mix`. Sample output
of the entire flow can be seen in `./sample_output/exp2.txt`. Note
that in the sample output, there is only one brewery in Malden, so the
query immediately expands to the entire state of Massachusetts at the
cost of duplicates (to be removed on the frontend).

After building out and combining these functions, a fully-functioning
function that converts coordinates to a paginated set of breweries was
successfully created and tested. So ultimately this experiment was
also a success.

Successfully completing this experiment allowed me to learn that,
thankfully, **Open Brewery DB** functions as its documentation
describes. I also learned what reverse geocoding is and how to use it
to solve a design problem.

### Types of Users and User Stories

*Hop Stop* has an obvious main target audience: people who love beer
and going to breweries. This demographic would likely make up 90% or
more of the user base, with the bulk of the remainder made up of their
friends and family who joined for the social aspect. A rarer type of
user might be researchers who are interested in the rating/comment
data (since it would likely be more reliable than Google Maps' data).

**Beer-Lovers: Finding Nearby Breweries**  
The main use case for *Hop Stop* is to find breweries that are nearby,
and many users, particularly in the 90+% described above, will have
entire sessions on the app dedicated just to that. These sessions
would involve logging in, landing on the search page, and clicking a
"Use My Location" button (situated next to a search bar for manual
entry). The users would then infinitely scroll through the results
until they are satisfied. The definition of "satisfied" here depends
on the user's motive; in most cases, this is just to see what's
around, but other times it might be to see how good a specific brewery
is, or which breweries their friends like. All of this information is
readily available either on the search page listing itself or on the
dedicated brewery page, accessed by clicking a listing.

**Beer-Lovers: Rating/Commenting/Favoriting**  
Users who just visited a brewery might want to act on their
experiences by using the options available to them in *Hop Stop*:
rating, commenting, and favoriting. For example, if users have a good
experience, they might do any or all of the following after searching
for that brewery: leave a 5 star rating, comment "This brewery is
amazing!", and favorite it so it is easy for them and their friends to
find it. On the other hand, if users have a bad experience, they might
leave a 0-1 star rating and/or a comment that says "I was treated
rudely and the beer was bad!"

**Friends of Beer-Lovers: Joining a Friend at a Brewery**  
If a user does not particularly love beer, most of their visits to
*Hop Stop* will be to join a friend who does. These users would likely
open the app and login, then immediately navigate to their
notifications, where any invitations to join friends at breweries will
be located along with matching timestamps. After deciding if/where
they want to go, the users' app experience would usually end there.

**Researchers: Viewing Rating/Comment Data**  
Whether it's scraping or manual viewing, a user who is only interested
in gathering ratings and comments will act in the following order: log
in to the app, then procedurally infinitely scroll (with whatever
location, search terms, and filters he/she desires), navigating into
and out of dedicated brewery pages for each listing in the search
results, gathering any desired data.