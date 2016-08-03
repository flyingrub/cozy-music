import Track from '../models/track';
import Tracks from '../collections/tracks';
import Playlist from '../models/playlist';
import application from '../application';
import cozysdk from 'cozysdk-client';
import { getDataURI } from './utils';

const api = 'https://api.soundcloud.com';
const clientID = '02gUJC0hH2ct1EGOcYXQIzRFU91c72Ea';

class Soundcloud {

    import(url) {
        let notification = {
            status: 'loading',
            message: t('importing from soundcloud')
        }
        application.channel.request('notification', notification);
        this.get('/resolve', { url: url }, (res) => {
            if (res.kind == 'playlist') {
                let playlist = new Playlist({
                    title: res.title,
                    tracks: new Tracks(),
                    type: 'playlist'
                });
                application.allPlaylists.create(playlist);
                for (let i = 0; i < res.tracks.length; i++) {
                    let track = res.tracks[i];
                    this.checkIfAlreadyExist(track, playlist);
                }
            } else if (res.kind == 'track') {
                this.checkIfAlreadyExist(res);
            }
        });
    }

    // Check if the track is already in the database
    checkIfAlreadyExist(track, playlist) {
        cozysdk.run('Track', 'soundcloud', {}, (err, tracks) => {
            if (tracks) {
                let trackID = undefined;
                for (let i = 0; i < tracks.length; i++) {
                    if (tracks[i].value.ressource.url == track.stream_url) {
                        trackID = tracks[i].value._id;
                    }
                }
                if (!trackID) {
                    let self = this;
                    getDataURI(track.artwork_url, (picture) => {
                        self.importTrack(track, picture, playlist);
                    });
                } else {
                    if (playlist) {
                        let tracks = application.allTracks.get('tracks');
                        let track = tracks.get(trackID);
                        playlist.addTrack(track);
                    } else {
                        let notification = {
                            status: 'ko',
                            message: t('track is already in the database')
                        }
                        application.channel.request('notification', notification);
                    }
                }
            }
        });
    }

    // Set the track's metas and save it.
    importTrack(track, picture, playlist) {
        if (!track.streamable) {
            let notification = {
                status: 'ko',
                message: t('this track is not streamable')
            }
            application.channel.request('notification', notification);
            return;
        }
        let newTrack = new Track();
        newTrack.set('ressource', {
            type: 'soundcloud',
            url: track.stream_url
        });
        let metas = {
            title: track.title,
            artist: track.user.username,
            genre: track.genre,
            duration: track.duration,
            picture: [ { data: picture } ]
        }
        if (playlist) metas.album = playlist.get('title');
        newTrack.set('metas', metas);
        application.allTracks.get('tracks').create(newTrack, {
            success: () => {
                if (playlist) playlist.addTrack(newTrack);
            }
        });

        let notification = {
            status: 'ok',
            message: t('stream track imported')
        }
        application.channel.request('notification', notification);
    }

    // Add our clientID to the current url
    addClientID(url) {
        return url + '?client_id=' + clientID;
    }

    // Call the soundcoud API
    get(endpoint, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = {};
        }

        let url;
        if (endpoint.includes(api)) {
            url = this.addClientID(endpoint);
        } else {
            url = this.addClientID(api + endpoint);
        }

        for (let key in params){
            if (params.hasOwnProperty(key)) {
                url += '&' + key + '=' + params[key];
            }
        }

        $.ajax({
            dataType: 'json',
            url: url,
            success: callback
        });
    }
}

export default new Soundcloud();
