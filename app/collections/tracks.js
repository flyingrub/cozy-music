import Backbone from 'backbone';
import Track from '../models/track';
import cozysdk from 'cozysdk-client';
import application from '../application'

const Tracks = Backbone.Collection.extend({

    model: Track,

    initialize(models, options) {
        this.type = options.type;
        if (this.type == 'upNext') {
            this.listenTo(application.appState,
                'change:currentTrack',
                function(appState, currentTrack) {
                    application.upNext.addTrack(currentTrack);
                }
            );
            this.listenTo(
                application.channel,{
                'upnext:reset': this.resetUpNext,
                'upnext:addCurrentPlaylist': this.addCurrentPlaylistToUpNext
            });
        }

        // Remove a track from all it's playlist when he is destroyed
        if (this.type != 'all') {
            this.listenTo(
                application.allTracks.get('tracks'),
                'remove',
                function(removedTrack, allTracks) {
                    this.remove(removedTrack);
                }
            );
        }
        this.on('change:hidden', this.removeTrack, this);
    },

    // UpNext : reset
    resetUpNext() {
        application.upNext.resetTrack();
    },

    // UpNext : Add current playlist to upNext if no track in UpNext
    addCurrentPlaylistToUpNext() {
        let currentPlaylist = application.appState.get('currentPlaylist');
        let currentTracks = currentPlaylist.get('tracks');
        if (this.length == 0) {
            currentTracks.each(track => {
                application.upNext.addTrack(track);
            });
        }
    },

    removeTrack(track) {
        this.remove(track);
    },

    sync(method, model, options) {
        if (method == 'read' && this.type == "all") {
            let promise = new Promise((resolve, reject) => {
                cozysdk.run('Track', 'playable', options.data, (err, res) => {
                    if (res) {
                        if (options && options.success) {
                            options.success(res);
                            resolve(res);
                        }
                    } else {
                        if (options && options.error) {
                            options.error(err);
                            reject(err);
                        }
                    }
                });
            });
            return promise;
        }
    },

    parse(tracks, options) {
        let result = [];
        for (let i = 0; i < tracks.length; i++) {
            result.push(tracks[i].value);
        }
        return result;
    }
});

// COZYSDK : Requests \\
cozysdk.defineRequest('File', 'music', (doc) => {
        if (doc.class == 'music') {
            emit(doc.name, doc);
        }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'all', (doc) => {
    if (!doc._attachments) {
        emit(doc._id, doc);
    }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'oldDoctype', (doc) => {
        if (doc.title) {
            emit(doc._id, doc);
        }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'playable', (doc) => {
        if (!doc.hidden && doc.metas) {
            emit(doc.metas.title, doc);
        }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'file', (doc) => {
        if (doc.ressource.type == 'file') {
            emit(doc._id, doc);
        }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'soundcloud', (doc) => {
        if (doc.ressource.type == 'soundcloud') {
            emit(doc._id, doc);
        }
    }, (error, response) => {
});

export default Tracks;
