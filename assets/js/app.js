// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
import "../css/app.scss"

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import deps with the dep name or local files with a relative path, for example:
//
//     import {Socket} from "phoenix"
//     import socket from "./socket"
//
import "phoenix_html"


// Some test code, just to have these accessible in the same repo
// The actual frontend will be a separate repo
// Second experiment, getting coordinates and displaying a map with the location marked and labeled
// This will be used to display current location (if possible) along with locations of breweries
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import GoogleMapReact from 'google-map-react';

function LocationDemo(_) {
  const [coords, setCoords] = useState();
  const [showMap, setShowMap] = useState(false);

    useEffect(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          setCoords(position.coords);
        });
      }
    });

    let body;
    if (showMap) {
      body = <MapDemo coords={coords} />
    } else if (coords) {
      body = <div>
        <div>
          Latitude: {coords.latitude}
        </div>
        <div>
          Longitude: {coords.longitude}
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setShowMap(true)}> Show Map </button>
        </div>
      </div>
    } else {
      body = <div><p>Getting coordinates</p></div>
    }

    return body;
}

// This will obviously be updated to actually update the state
function MapDemo({ coords }) {
  return (
    // package requires a height/width explicitly
    <div style={{ height: '100vh', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{key: "redacted"}}
        defaultCenter={{lat: coords.latitude, lng: coords.longitude}}
        defaultZoom={11}
      >
        {/* Will use a better looking component */}
        <div lat={coords.latitude} lng={coords.longitude}>You are here</div>
        <div lat={coords.latitude + 0.1} lng={coords.longitude + 0.1}>A brewery might be here</div>
      </GoogleMapReact>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <LocationDemo />
  </React.StrictMode>,
  document.getElementById('root')
);