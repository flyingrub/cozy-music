import Mn from 'backbone.marionette';
import TrackView from './track';
import application from '../application';


const TracksView = Mn.CompositeView.extend({

    template: require('./templates/tracks'),

    childViewContainer: '#track-list',

    childView: TrackView,

    events: {
         'mousedown .drag': 'dragStart'
    },

    initialize() {
        this.dragObj = {
            'dragDown': false,
            'model': undefined,
            'newIndex': undefined
        };
    },

    onRender() {
        let style = document.createElement('style');
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        this.sheet = style.sheet;

        this.listenTo(application.appState, 'change:currentPlaylist',
            this.displayTrack, this);
        this.displayTrack(null, application.appState.get('currentPlaylist'));
        application.loadTrack.then(this.bindDragEvents.bind(this));
    },

    bindDragEvents() {
        $(document).mousemove(this.drag.bind(this));
        $(document).mouseup(this.dragEnd.bind(this));
    },

    dragStart(e) {
        e.stopPropagation();
        let htmlTrack = $(e.currentTarget).parents('li');
        htmlTrack.addClass('dragged');
        let id = htmlTrack.data('id');
        let track = application.appState
                            .get('currentPlaylist')
                            .get('tracks')
                            .get(id);
        this.dragObj.dragDown = true;
        this.dragObj.model = track;
    },

    dragEnd(e) {
        if (!this.dragObj.dragDown) return;

        // Reset all Style
        this.$el.find('#track-list').children()
            .removeClass('dragged dragover above below');

        // Reorder the track to the new position
        let tracks = application.appState.get('currentPlaylist');
        tracks.reorderTrack(this.dragObj.model, this.dragObj.newIndex);

        // Reset the drag object
        this.dragObj = {
            'dragDown': false,
            'model': undefined,
            'newIndex': undefined
        };
    },

    drag(e) {
        if (!this.dragObj.dragDown) return;

        // Get the track we hover
        let track = document.elementFromPoint(e.clientX, e.clientY);
        track = $(track);
        if (track.parent('#track-list').length) {
            // The track is already the `li` element
            track = $(track);
        } else if (track.parents('li').length) {
            // One of the parent is the li element
            track = $(track).parents('li');
        } else {
            // the cursor is not above a track
            return;
        }
        // Reset all precedent class
        track.removeClass('dragover above below')
            .siblings()
            .removeClass('dragover above below');

        // if we hover the track we want to reorder
        if (track.hasClass('dragged')) return;

        let oldIndex = parseInt(
                            this.$el.find('#track-list')
                            .children('.dragged')
                            .get(0).style.order
                        );
        let newIndex = parseInt(track.get(0).style.order);
        let lastIndex = application.appState
                            .get('currentPlaylist')
                            .get('tracks')
                            .length -1

        let offset = track.offset();
        if (!offset) return; // if the cursor is not in the track-list

        // Calculate if we are in the upper half of the hovered track
        let mouseY =  (e.pageY - offset.top) / track.height();
        if (mouseY < 0.5) {
            // the track should be placed above the track we hover
            track.addClass('dragover above');
            newIndex = newIndex == oldIndex +1 ? oldIndex : newIndex;
            newIndex = newIndex == lastIndex ? lastIndex -1 : newIndex;
        } else {
            track.addClass('dragover below');
            newIndex = newIndex == oldIndex -1 ? oldIndex : newIndex;
            newIndex = newIndex == 0 ? 1 : newIndex;
        }
        this.dragObj.newIndex = newIndex;
    },

    displayTrack(appState, currentPlaylist) {
        // Reset selected track
        application.selected.resetTrack();
        // Allow to display the correct menu
        for (let i=0; i < this.sheet.cssRules.length; i++) {
            this.sheet.deleteRule(i);
        }
        let type = currentPlaylist.get('type');
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
