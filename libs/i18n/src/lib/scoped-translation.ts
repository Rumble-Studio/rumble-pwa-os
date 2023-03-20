import { AVAILABLE_LANGS } from './i18n.config';

export const scopeLoader = (importer: any) => {
	return AVAILABLE_LANGS.reduce((acc: any, lang) => {
		acc[lang] = () => importer(lang);
		return acc;
	}, {});
};
