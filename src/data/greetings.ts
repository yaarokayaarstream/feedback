export interface GreetingItem {
  id: string;
  language: string;
  nativeWord: string;
  subphrase: string;
  pronunciation?: string;
  badge: string;
}

export const GREETINGS_LIST: GreetingItem[] = [
  {
    id: 'en',
    language: 'English',
    nativeWord: 'WELCOME',
    subphrase: 'Yaaro Ka Yaar',
    badge: 'English',
  },
  {
    id: 'hi',
    language: 'Hindi',
    nativeWord: 'स्वागत है',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Swagat Hai',
    badge: 'हिंदी',
  },
  {
    id: 'pa',
    language: 'Punjabi',
    nativeWord: 'ਜੀ ਆਇਆਂ ਨੂੰ',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Ji Aayan Nu',
    badge: 'ਪੰਜਾਬੀ',
  },
  {
    id: 'bn',
    language: 'Bangali',
    nativeWord: 'স্বাগতম',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Shagotom',
    badge: 'বাংলা',
  },
  {
    id: 'gu',
    language: 'Gujarati',
    nativeWord: 'સ્વાગત છે',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Swagat Chhe',
    badge: 'ગુજરાતી',
  },
  {
    id: 'mr',
    language: 'Marathi',
    nativeWord: 'स्वागत आहे',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Swagat Aahe',
    badge: 'मराठी',
  },
  {
    id: 'kn',
    language: 'Kannada',
    nativeWord: 'ಸ್ವಾಗತ',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Swagatha',
    badge: 'ಕನ್ನಡ',
  },
  {
    id: 'ml',
    language: 'Malayalam',
    nativeWord: 'സ്വാഗതം',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Swagatham',
    badge: 'മലയാളം',
  },
  {
    id: 'ta',
    language: 'Tamil',
    nativeWord: 'வரவேற்கிறோம்',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Varaverkirom',
    badge: 'தமிழ்',
  },
  {
    id: 'te',
    language: 'Telugu',
    nativeWord: 'స్వాగతం',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Swagatham',
    badge: 'తెలుగు',
  },
  {
    id: 'or',
    language: 'Oriya',
    nativeWord: 'ସ୍ୱାଗତ',
    subphrase: 'Yaaro Ka Yaar',
    pronunciation: 'Swagata',
    badge: 'ଓଡ଼ିଆ',
  },
];
