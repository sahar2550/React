import react, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './App.css';

import L from 'leaflet';
import { MapContainer, useMapEvents, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

import * as storage from './storage.js';
import PopupBottom from './components/PopupBottom';

const apiKey = 'pk.eyJ1Ijoid2FybG9jazY2NiIsImEiOiJja2VzZGdnM2UwNHpqMnFwN2c2ZmxjM3FuIn0.-tgnnJduGg6Wb3_POfxVQQ';
const dataKey = 'tmpData';


function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres

  return d;
}

var favoriteIcon = L.icon({
  iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-orange.png",
  shadowUrl: "https://leafletjs.com/examples/custom-icons/leaf-shadow.png",
  iconSize: [38, 95], // size of the icon
  shadowSize: [50, 64], // size of the shadow
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62],  // the same for the shadow
  popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var defIcon = L.icon({
  iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png",
  shadowUrl: "https://leafletjs.com/examples/custom-icons/leaf-shadow.png",
  iconSize: [38, 95], // size of the icon
  shadowSize: [50, 64], // size of the shadow
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62],  // the same for the shadow
  popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var selectedAndSearchIcon = L.icon({
  iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-red.png",
  shadowUrl: "https://leafletjs.com/examples/custom-icons/leaf-shadow.png",
  iconSize: [38, 95], // size of the icon
  shadowSize: [50, 64], // size of the shadow
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62],  // the same for the shadow
  popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

function App() {

  const [markers, setMarkers] = useState([]);
  const [clickPosition, setClickPosition] = useState(null);
  const [showDirection, setShowDirection] = useState(false);

  const [startPosition, setStartPosition] = useState(null);
  const [endPosition, setEndPosition] = useState(null);

  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
      iconUrl: require('leaflet/dist/images/marker-icon.png').default,
      shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
    });

    restoreItem();

  }, [])

  useEffect(() => {
    console.log('useEffect markers tag => ', markers);
    if (markers.length > 0) {
      console.log('markers.length => ', markers.length);
      saveItem();
    }
    if (markers.length === 3) {
      addItemToList(addItemTest);
    }
  }, [markers])

  useEffect(() => {
    console.log('useEffect startPosition tag => ', startPosition);

    if (startPosition && endPosition) {
      console.log('====================================');
      console.log('startPosition => ', startPosition);
      console.log('endPosition => ', endPosition);
      console.log('====================================');
      setShowDirection(true);
    }

    if (!endPosition) {
      // findEndPosition();
    }

  }, [startPosition, endPosition])

  async function restoreItem() {
    const restoredItem = await storage.restoreItem(dataKey);
    console.log('restoredItem => ', restoredItem);
    if (restoreItem !== undefined && restoredItem !== null) {
      setMarkers(restoredItem);
    } else {
      setMarkers(defaultPosition);
    }
  }

  async function saveItem() {
    try {
      await storage.saveItem(dataKey, markers);
      console.log('saveItem');
    } catch (ex) {
      console.log('====================================');
      console.log('error app-saveItem => ', ex);
      console.log('====================================');
    }
  }

  function addPosition(lat, lng) {
    try {

      const enteredTitle = prompt('Please enter your location title: ');
      const enteredDescription = prompt('Please enter your location description: ');

      const newItem = {
        id: markers[markers.length - 1].id + 1,
        title: enteredTitle,
        latitude: lat,
        longitude: lng,
        description: enteredDescription,
        favorite: false,
      }

      addItemToList(newItem);
      setClickPosition(null);

    } catch (ex) {
      console.log('====================================');
      console.log('error app-addPosition => ', ex);
      console.log('====================================');
    }

  }

  function addItemToList(item) {
    try {
      console.log('addItemToList');
      const newValue = [
        ...markers,
        item
      ];
      setMarkers(newValue)
    } catch (ex) {
      console.log('====================================');
      console.log('error app-addItemToList => ', ex);
      console.log('====================================');
    }
  }

  function removeItemFromList(item) {
    try {
      console.log('removeItemFromList');
      const newValue = markers.filter((cItem) => {
        return cItem.id !== item.id;
      });
      setMarkers(newValue)
    } catch (ex) {
      console.log('====================================');
      console.log('error app-removeItemFromList => ', ex);
      console.log('====================================');
    }
  }

  function addFavorite(item) {
    try {
      console.log('addFavorite');
      setMarkers(
        markers.filter((cItem) => {
          if (cItem.id === item.id) {
            cItem.favorite = true
          }
          return cItem
        })
      )
    } catch (ex) {
      console.log('====================================');
      console.log('error app-addFavorite => ', ex);
      console.log('====================================');
    }
  }

  function removeFavorite(item) {
    try {
      console.log('removeFavorite');
      setMarkers(
        markers.filter((cItem) => {
          if (cItem.id === item.id) {
            cItem.favorite = false
          }
          return cItem
        })
      )
    } catch (ex) {
      console.log('====================================');
      console.log('error app-removeFavorite => ', ex);
      console.log('====================================');
    }
  }

  function LocationMarker() {
    const [position, setPosition] = useState(null)
    const map = useMapEvents({
      click(e) {
        setClickPosition({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        })

        findEndPosition(e.latlng.lat, e.latlng.lng);
      },
      locationfound(e) {
        setPosition(e.latlng)
        map.flyTo(e.latlng, map.getZoom())
      },
    })

    return position === null ? null : (
      <Marker position={position}>
        <Popup>You are here</Popup>
      </Marker>
    )
  }

  function Routing() {
    const map = useMap();

    useEffect(() => {
      if (!map) return;

      console.log('*******************');
      console.log('*******************');
      console.log('startPosition => ', startPosition);
      console.log('endPosition => ', endPosition);
      console.log('*******************');

      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(startPosition.lat, startPosition.lng),
          L.latLng(endPosition.lat, endPosition.lng)],
        routeWhileDragging: true
      }).addTo(map);

      return () => map.removeControl(routingControl);
    }, [map]);

    return null;
  }

  function findEndPosition(lat, lng) {
    console.log('====================================');
    console.log('lat, lng => ', lat, lng);
    console.log('markers => ', markers);
    console.log('====================================');
    let distanceList = [];
    markers.forEach(marker => {
      const distance = calcDistance(lat, lng, marker.latitude, marker.longitude);
      distanceList.push(
        {
          distance: distance,
          latitude: marker.latitude,
          longitude: marker.longitude
        }
      );
    });
    // sortArray
    const sortMarkers = distanceList.sort((a, b) => {
      return a.distance - b.distance;
    });
    console.log('sortMarkers => ', sortMarkers);
    setEndPosition({
      lat: sortMarkers[0].latitude,
      lng: sortMarkers[0].longitude
    });
  }

  const SearchField = () => {

    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider: provider,
      showMarker: false, // optional: true|false  - default true
      showPopup: false, // optional: true|false  - default false
      notFoundMessage: 'Not found.',
      marker: {
        icon: new L.Icon.Default(),
        draggable: false,
      },
      // style: 'bar',
      maxMarkers: 1, // optional: number      - default 1
      animateZoom: true, // optional: true|false  - default true
      autoClose: false, // optional: true|false  - default false
      searchLabel: 'Enter address', // optional: string      - default 'Enter address'
      keepResult: true, // optional: true|false  - default false
      updateMap: true, // optional: true|false  - default true,

    });

    const map = useMap();
    useEffect(() => {

      map.addControl(searchControl);

      map.on('geosearch/showlocation', addSearchMarker);
      searchControl.getContainer().onclick = e => { e.stopPropagation(); };

      return () => map.removeControl(searchControl);
    }, [map, markers]);

    return null;
  };

  function addSearchMarker(e) {

    console.log('====================================');
    console.log('e => ', e);
    // console.log('e => ', {
    //   position: {
    //     lat: e.location.y,
    //     lng: e.location.x
    //   },
    //   label: e.location.label
    // });
    console.log('====================================');

    // findEndPosition(e.location.y, e.location.x);
  }

  return (
    <div
      style={{
        alignItems: 'center'
      }}>

      <MapContainer
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 50,
        }}
        center={[52.521770944442856, 13.647581722715671]}
        zoom={13}
        scrollWheelZoom={false}>

        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          accessToken={apiKey}
        />

        <SearchField />
        {
          markers.length > 0 && markers.map((item, index) => {

            return (
              <Marker
                key={index}
                position={[item.latitude, item.longitude]}
                icon={item.favorite ? favoriteIcon : defIcon}>
                <Popup>
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "30px"
                    }}>
                    <div className="m-2" style={{
                      fontWeight: "bold",
                      fontSize: "22px"
                    }}>
                      {item.title}
                    </div>
                    <span style={{
                      fontSize: "15px",
                      marginBottom: "20px"
                    }}>
                      {item.description}
                    </span>

                    <div
                      style={{
                        width: '100%',
                        display: 'inline-flex'
                      }}>

                      <PopupBottom
                        title='Remove position'
                        backColor={'tomato'}
                        onPress={() => {
                          console.log('====================================');
                          console.log('Remove position');
                          console.log('====================================');
                          const r = window.confirm("Press a button!");
                          if (r) {
                            removeItemFromList(item);
                          }
                        }} />

                      <PopupBottom
                        title={item.favorite ? 'Remove favorite' : 'Add favorite'}
                        backColor={'darkgoldenrod'}
                        onPress={() => {
                          console.log('====================================');
                          console.log('Favorite position');
                          console.log('====================================');
                          if (item.favorite) {
                            removeFavorite(item);
                          } else {
                            addFavorite(item);
                          }
                        }} />

                    </div>
                  </div>
                </Popup>
                <Tooltip>{item.title}</Tooltip>
              </Marker>
            );
          })
        }

        {clickPosition &&
          <Marker

            position={[clickPosition.latitude, clickPosition.longitude]}
            icon={selectedAndSearchIcon}>
            <Popup>
              <div
                style={{
                  textAlign: "center",
                  marginTop: "30px"
                }}>
                <div className="m-2" style={{
                  fontWeight: "bold",
                  fontSize: "22px"
                }}>
                  Location
                </div>
                <span style={{
                  fontSize: "15px",
                  marginBottom: "20px"
                }}>
                  latitude: ${clickPosition.latitude} <br />
                  longitude: ${clickPosition.longitude}
                </span>

                <div
                  style={{
                    width: '100%',
                    display: 'inline-flex'
                  }}>

                  <PopupBottom
                    title='Add position'
                    onPress={() => {
                      console.log('====================================');
                      console.log('Add position');
                      console.log(`latitude is ${clickPosition.latitude} , longitude is ${clickPosition.longitude}`);
                      console.log('====================================');
                      addPosition(clickPosition.latitude, clickPosition.longitude);
                    }} />

                  <PopupBottom
                    title='Direction from'
                    backColor={'forestgreen'}
                    onPress={() => {
                      console.log('====================================');
                      console.log('Direction from');
                      console.log(`latitude is ${clickPosition.latitude} , longitude is ${clickPosition.longitude}`);
                      console.log('====================================');
                      setStartPosition(
                        {
                          lat: clickPosition.latitude,
                          lng: clickPosition.longitude
                        }
                      )
                      findEndPosition(clickPosition.latitude, clickPosition.longitude);
                    }} />

                </div>

              </div>
            </Popup>
          </Marker>}

        <LocationMarker />

        {showDirection && <Routing />}

      </MapContainer>

      {showDirection && <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: 50,
          backgroundColor: 'gold',
          zIndex: 2,
          alignItems: 'center',
          textAlign: '-webkit-center'
        }}>

        <div
          onClick={() => {
            setStartPosition(null);
            setEndPosition(null);
            setShowDirection(false);
          }}
          style={{
            width: '30%',
            height: 50,
            backgroundColor: 'dodgerblue',
            textAlign: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            paddingTop: 16,
            color: 'white'
          }}>
          End direction
        </div>

      </div>}

    </div>
  );
}

const defaultPosition = [
  {
    id: 100,
    title: 'Netto',
    latitude: 52.521770944442856,
    longitude: 13.647581722715671,
    description: 'Netto - GÜNSTIG. BESSER. FÜR DICH',
    favorite: false,
  },
  {
    id: 101,
    title: 'Bosch',
    latitude: 52.49618253374517,
    longitude: 13.760885353577775,
    description: 'Bosch Car Service Olaf Schuster',
    favorite: false,
  },
  {
    id: 102,
    title: 'Kaufland',
    latitude: 52.49743243900768,
    longitude: 13.743938844267465,
    description: 'Kaufland Vogelsdorf',
    favorite: false,
  },

];

const addItemTest = {
  id: 200,
  title: 'Kaufland',
  latitude: 52.49743243900768,
  longitude: 13.743938844267465,
  description: 'Kaufland Vogelsdorf',
  favorite: false,
}

export default App;