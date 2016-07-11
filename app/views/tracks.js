import Mn from 'backbone.marionette';
import TrackView from './track';
import application from '../application';


const TracksView = Mn.CompositeView.extend({

    template: require('./templates/tracks'),

    childViewContainer: '#track-list',

    childView: TrackView,

    onRender() {
        let style = document.createElement('style');
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        this.sheet = style.sheet;

        this.listenTo(application.appState, 'change:currentPlaylist',
            this.displayTrack, this);
    },

    displayTrack(appState, currentPlaylist) {
        for (let i=0; i < this.sheet.cssRules.length; i++) {
            this.sheet.deleteRule(i);
        }
        let type = currentPlaylist.get('tracks').type;
        if (type == 'playlist') {
            let id = currentPlaylist.get('_id')
            this.sheet.insertRule(`
                #track-list > li:not(.playlist-${id}) { display: none }
            `, 0);
        } else if (type != 'all') {
            this.sheet.insertRule(`
                #track-list > li:not(.playlist-${type}) { display: none }
            `, 0);
        }
    }

});

export default TracksView;
