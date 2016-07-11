import Backbone from 'backbone';
import cozysdk from 'cozysdk-client';
import Tracks from '../collections/tracks';
import application from '../application';


const Playlist = Backbone.Model.extend({

    defaults: {
        _id: undefined,
        title: '',
        tracks: '',
        dateAdded: Date.now
    },

    initialize(attributes, options) {
        let tracks = attributes.tracks || new Tracks([], {
            type: 'playlist'
        });
        this.set('tracks', tracks);
    },

    idAttribute:'_id',

    sync(method, model, options) {
        switch (method) {
            case 'create':
                cozysdk.create('Playlist', model.toJSON(), (err, res) => {
                    if (res) {
                        model.set('_id', res._id);
                        options.success();
                    }
                });
                break;
            case 'read':
                cozysdk.find('Playlist', model.get('_id'), (err, res) => {
                    if (res) {
                        options.success();
                    }
                 });
                break;
            case 'update':
                cozysdk.updateAttributes(
                    'Playlist', model.id, model.toJSON(), (err, res) => {
                    if (res) {
                        options.success();
                    }
                });
                break;
            case 'delete':
                cozysdk.destroy('Playlist', model.get('_id'), (err, res) => {
                    if (res) {
                        options.success();
                    }
                });
                break;
        }
    },

    // Add a track to the playlist
    addTrack(track) {
        let tracks = this.get('tracks');
        tracks.push(track);
        application.channel.trigger('track:playlistChanged', track);
        if (tracks.type == 'playlist') this.save();
    },

    // Remove a track to the playlist
    removeTrack(track) {
        let tracks = this.get('tracks');
        tracks.remove(track);
        application.channel.trigger('track:playlistChanged', track);
        if (tracks.type == 'playlist') this.save();
    },

    // Used to resetUpNext and set search track
    resetTrack(tracks) {
        let oldTrack = _.clone(this.get('tracks'));
        this.get('tracks').reset(tracks);

        oldTrack.add(tracks);
        oldTrack.each((track) => {
            application.channel.trigger('track:playlistChanged', track);
        });
    },

    parse(attrs, options) {
        if (attrs) {
            let tracks = attrs.tracks;
            attrs.tracks = new Tracks(tracks, { type: 'playlist'});
            return attrs
        }
    }
});

export default Playlist;
