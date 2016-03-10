import Mn from 'backbone.marionette';
import application from '../application';


const TrackView = Mn.ItemView.extend({
    
    template: require('./templates/track'),

    tagName: 'tr',

    events: {
        'click': 'play',
        'click .delete': 'delete'
    },

    modelEvents: { change: 'render' },

    play: function (e) {
        const tracks = application.appLayout.getTracksView();
        application.upNext.currentIndex = tracks.collection.indexOf(this.model);
        this.model.getStreamAndPlay();
        $(e.currentTarget)
            .addClass('playing')
            .siblings()
            .removeClass('playing');
    },
    
    delete: function (e) {
        const item = this.model;
        item.set('hidden', true);
        item.save();
        application.allTracks.remove(item);
    },
    
    serializeData: function() {
        let number, title, artist, album;
        if (this.model.get('metas').title) {
            title = this.model.get('metas').title;
        }

        if (this.model.get('metas').album) {
            album = this.model.get('metas').album;
        }

        if (this.model.get('metas').artist) {
            artist = this.model.get('metas').artist;
        }
        return {
            number: 4,
            title: title,
            artist: artist,
            album: album
        };
    }
});

export default TrackView;