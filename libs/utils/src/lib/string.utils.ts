export function validateEmail(email: string) {
	const re =
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}

export function capitalize(s: string): string {
	if (typeof s !== 'string') return '';
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export function convertMailToStarredEmail(who: string): string {
	if (!who) return '';
	const emailBeginning = who.split('@')[0];
	const emailDomain = who.split('@')[1];
	const result = emailBeginning.substring(0, 3) + '***' + '@' + emailDomain.substring(0, 3) + '***.***';
	return result;
}

export function convertMailToDisplayname(who: string): string {
	if (!who) return '';
	let emailBeginning = who.split('@')[0];
	let suffixe = '';
	if (emailBeginning.indexOf('+') > 0) {
		const split = emailBeginning.split('+');
		suffixe = '(' + emailBeginning.substring(emailBeginning.indexOf('+') + 1) + ')';
		emailBeginning = split[0];
	}
	let firstName = emailBeginning;
	let lastName = '';
	if (emailBeginning.indexOf('.') > 0) {
		const split = emailBeginning.split('.');
		firstName = capitalize(split[0]);
		lastName = ' ' + capitalize(split[1]);
	} else {
		firstName = capitalize(firstName);
	}

	return firstName + lastName + suffixe;
}
