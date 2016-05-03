import Backbone from 'backbone';
import Track from '../models/track';
import cozysdk from 'cozysdk-client';
import application from '../application'

const Tracks = Backbone.Collection.extend({

    model: Track,

    initialize(models, options) {
        this.type = options.type;
        if (this.type == 'upNext') {
            this.listenTo(application, 'start', this.addCurrentTrackToUpNext);
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
        application.appState.set('currentTrack', undefined);
        application.upNext.get('tracks').reset();
    },

    // UpNext : Add current playlist to upNext if no track in UpNext
    addCurrentPlaylistToUpNext() {
        let currentPlaylist = application.appState.get('currentPlaylist');
        let tracks = currentPlaylist.get('tracks');
        if (tracks == this) {
            tracks = application.allTracks.get('tracks');
        }
        if (application.upNext.get('tracks').length == 0) {
            tracks.each(track => {
                application.upNext.get('tracks').add(track);
            });
        }
    },

    // UpNext : add the current track to up next if not alreay in it
    addCurrentTrackToUpNext() {
        this.listenTo(
            application.appState,
            'change:currentTrack',
            function(appState, currentTrack) {
                this.push(currentTrack);
            }
        );
    },

    removeTrack(track) {
        this.remove(track);
    },

    comparator(model) {
        return model.get('metas').title;
    },

    sync(method, model, options) {
        if (method == 'read' && this.type == "all") {
            cozysdk.run('Track', 'playable', {}, (err, res) => {
                if (res) {
                    if (options && options.success) {
                        options.success(res);
                    }
                } else {
                    if (options && options.error) {
                        options.error(err);
                    }
                }
            });
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
            emit(doc._id, doc);
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
            emit(doc._id, doc);
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
