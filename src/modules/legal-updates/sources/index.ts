import {LegalUpdateSourceAdapter} from '../../../interfaces/LegalUpdates';
import {corteConstitucionalSource, presidenciaNormativaSource} from './soda.source';
import {actualiceseSource, corteSupremaSource} from './rss.source';

export const SOURCE_ADAPTERS: LegalUpdateSourceAdapter[] = [
    corteConstitucionalSource,
    corteSupremaSource,
    presidenciaNormativaSource,
    actualiceseSource,
];

export const SOURCE_LABELS = new Map(SOURCE_ADAPTERS.map(adapter => [adapter.source, adapter.sourceLabel]));
