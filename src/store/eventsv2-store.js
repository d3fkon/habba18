import { observable, action, computed, runInAction } from 'mobx';
import { AsyncStorage as storage } from 'react-native';
import { colors } from '../constants';
import { create, persist } from 'mobx-persist';
import axios from 'axios';

const EVENTSV2 = 'http://acharyahabba.in/habba18/json.php';

class EventStore {
    @persist('list') @observable mainList = [];
    @persist('object') @observable timelineObj = {};
    bak = [];
    @observable selectedCategory = {
        name: 'Music',
        index: 1,
    };
    @observable error = {
        present: false,
        message: null
    }
    @observable eventIndex = 0;
    @observable isFetching = false;
    @action fetchAllEvents = async () => {
        this.bak = this.mainList;
        this.mainList = [];
        this.isFetching = true;
        try {
            const P1 = axios.get(EVENTSV2);
            const res = await Promise.resolve(P1);
            this.mainList = res.data.result;
            this.isFetching = false;
            this.bak = this.mainList;
            this.makeTimeline()

        } catch (e) {
            // this.mainList = this.bak; // BACKUP FALLBACK
            this.errorMessage = e.message;
            this.errorPresent = true;
            this.isFetching = false;
            this.makeTimeline();
            console.log(e.message);
        }
    }
    @computed get categoryList() {
        return this.mainList.map(cat => ({ name: Object.keys(cat)[1], url: cat.image_url, length: cat[Object.keys(cat)[1]].length })).slice()
    }

    @computed get eventsList() {
        return this.mainList.slice()[this.selectedCategory.index][this.selectedCategory.name].slice();
    }

    @computed get _mainList() {
        return this.mainList.slice()
    }
    @action setCategory = o => { this.selectedCategory = { ...o } };
    @action setEventIndex = i => { this.eventIndex = i };

    @action makeTimeline = () => {
        this.mainList.map(c => {
            let key = Object.keys(c)[1];
            c[key].map(e => {
                if (!this.timelineObj[e.date])
                    this.timelineObj[e.date] = [];
                this.timelineObj[e.date].push(e)
            })
        })
    }
    @computed get markedDates() {
        const marked = {};
        Object.keys(this.timelineObj).map(k => {
            marked[k] = { marked: true, dotColor: colors.primary }
        });
        return marked;
    }
    @action eventsFromDate = date => {
        if (this.timelineObj[date])
            return this.timelineObj[date]
        return [];
    }
    @computed get selectedEventIndex() {
        return parseInt(this.eventIndex)
    }
}

const hydrate = create({ storage })

export default eventsStore = new EventStore();

hydrate('EventStoreV2', eventsStore).then(() => { console.log('Event Store Hydrated') }).catch(e => console.log('ERROR', e));

eventsStore.fetchAllEvents();