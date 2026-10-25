// Fragen und Antworten. Werden auf /fragen bzw. /en/faq gezeigt und als FAQPage-Daten für Google ausgegeben.
import { site, delivery } from '../site';
import type { Lang } from '../i18n';

export interface Frage {
  frage: string;
  antwort: string; // einfacher Text, Absätze mit Leerzeile trennen
}
type Gruppe = { titel: string; anker?: string; fragen: Frage[] }; // anker: Sprungziel auf der FAQ-Seite

const de: Gruppe[] = [
  {
    titel: 'Geburtszeit',
    anker: 'geburtszeit',
    fragen: [
      {
        frage: 'Was passiert, wenn ich die Geburtszeit nicht kenne?',
        antwort:
          'Du kannst trotzdem bestellen, zum gleichen Preis. Setz im Formular das Häkchen „Geburtszeit unbekannt“. Ohne Uhrzeit lassen sich der Aszendent und die zwölf Häuser nicht bestimmen. Der Aszendent ist das Tierkreiszeichen, das bei deiner Geburt am östlichen Horizont aufging. Die Häuser teilen das Geburtsbild in zwölf Lebensbereiche. Die Kapitel, die darauf aufbauen, sind dann vorsichtiger formuliert. Das steht auch im Horoskop selbst.',
      },
      {
        frage: 'Wo finde ich meine Geburtszeit?',
        antwort:
          'Die Uhrzeit ist im Geburtenregister beim Standesamt deines Geburtsorts eingetragen. Steht sie nicht auf deiner Urkunde, kannst du dort einen Auszug aus dem Geburtenregister anfragen. Oft wissen es auch die Eltern oder es steht im Familienstammbuch.',
      },
      {
        frage: 'Muss ich die Uhrzeit in Weltzeit umrechnen?',
        antwort:
          'Nein. Gib die Uhrzeit so ein, wie sie am Geburtsort galt. Sommerzeit und Zeitzone rechnet die Berechnung selbst über die offizielle Zeitzonendatenbank um.',
      },
    ],
  },
  {
    titel: 'Lieferung und Format',
    fragen: [
      {
        frage: 'Wie schnell kommt das Horoskop?',
        antwort: `${delivery.sentence('de')} ${delivery.phase === 2 ? 'Auch als Geschenk in letzter Minute klappt es also noch.' : 'Für ein Geschenk am Abend reicht es also, wenn du rechtzeitig vorher bestellst.'}`,
      },
      {
        frage: 'In welchem Format kommt das Horoskop?',
        antwort: `Als PDF mit ${site.umfang.de}. ${site.umfangSchwankung.de} Es kommt per Mail an die Adresse, die du bei der Bestellung angibst. Du kannst es weiterleiten, ausdrucken oder auf dem Tablet lesen. Das Deckblatt mit dem Geburtsbild ist so gestaltet, dass man es auch einrahmen und aufhängen kann.`,
      },
      {
        frage: 'Hell oder dunkel, was soll ich nehmen?',
        antwort:
          'Beide Fassungen haben denselben Inhalt und kosten gleich viel. Die helle eignet sich besser zum Ausdrucken, die dunkle wirkt am Bildschirm besonders ruhig. Für 5 € Aufpreis bekommst du beide Fassungen. Eine Entscheidungshilfe mit beiden Fassungen nebeneinander findest du auf der Seite „Zwei Fassungen“.',
      },
      {
        frage: 'Kann ich das Horoskop verschenken?',
        antwort:
          'Ja, dafür ist es gemacht. Gib bei der Bestellung die Geburtsdaten der beschenkten Person an und deine eigene Mail-Adresse. Du bekommst das PDF und entscheidest selbst, wie du es überreichst.',
      },
    ],
  },
  {
    titel: 'Inhalt und Entstehung',
    fragen: [
      {
        frage: 'Wie entsteht das Horoskop?',
        antwort:
          'Zuerst wird berechnet, wo Sonne, Mond und Planeten zum Zeitpunkt und am Ort der Geburt standen. Diese Berechnung ist astronomisch exakt. Daraus entsteht ein individueller Text über Persönlichkeit, Stärken und Lebensthemen, gegliedert in siebzehn Kapitel.',
      },
      {
        frage: 'Ist das eine Vorhersage?',
        antwort:
          'Nein. Astrologie ist ein Deutungssystem. Das Horoskop beschreibt Anlagen und Themen, es sagt keine Ereignisse voraus. Es ersetzt keine medizinische, psychologische oder rechtliche Beratung.',
      },
      {
        frage: 'Ersetzt das Horoskop eine Astrologin oder einen Astrologen?',
        antwort:
          'Nein. Unser Horoskop ist ein sorgfältiger Einstieg in das eigene Geburtsbild. Eine persönliche Sitzung bei einer erfahrenen Astrologin oder einem erfahrenen Astrologen ist deutlich persönlicher und ausführlicher, weil dort nachgefragt, abgewogen und auf die eigene Lebenslage eingegangen werden kann. Wenn dir dein Horoskop gefallen hat, empfehlen wir dir diesen Schritt ausdrücklich. Mehr dazu unten unter „Ausführlich erklärt“.',
      },
    ],
  },
  {
    titel: 'Bezahlung und Daten',
    fragen: [
      {
        frage: 'Wie kann ich bezahlen?',
        antwort: `Mit Karte, PayPal oder Apple Pay. Ein Horoskop kostet ${site.priceLabel.de}, hell oder dunkel zum gleichen Preis. Beide Fassungen zusammen kosten ${site.bothPriceLabel.de}.`,
      },
      {
        frage: 'Kann ich einen Gutschein einlösen?',
        antwort:
          'Ja. Im Warenkorb gibt es das Feld „Gutscheincode einlösen“. Der Rabatt wird beim Bezahlen abgezogen.',
      },
      {
        frage: 'Kann ich die Bestellung widerrufen?',
        antwort:
          'Das Horoskop wird nach der Bestellung eigens für dich erstellt. Deshalb stimmst du beim Kauf zu, dass die Erstellung sofort beginnt. Damit verzichtest du auf dein Widerrufsrecht. Die Einzelheiten stehen in der Widerrufsbelehrung.',
      },
      {
        frage: 'Was passiert mit den Geburtsdaten?',
        antwort:
          'Sie werden nur für die Erstellung des Horoskops genutzt. Wie lange sie gespeichert und wann sie gelöscht werden, steht in der Datenschutzerklärung.',
      },
    ],
  },
];

const en: Gruppe[] = [
  {
    titel: 'Birth time',
    anker: 'geburtszeit',
    fragen: [
      {
        frage: 'What if I do not know the birth time?',
        antwort:
          'You can still order, at the same price. Tick “Birth time unknown” in the form. Without the time, the ascendant and the twelve houses cannot be determined. The ascendant is the zodiac sign that was rising on the eastern horizon at the moment of birth. The houses divide the natal chart into twelve areas of life. The chapters that build on them are then worded more cautiously. The horoscope itself says so as well.',
      },
      {
        frage: 'Where can I find my birth time?',
        antwort:
          'The time is usually recorded by the registry office of the place of birth. If it is not on your certificate, you can request a full extract from the birth register there. Parents, hospital records or family documents often have it too.',
      },
      {
        frage: 'Do I have to convert the time to universal time?',
        antwort:
          'No. Enter the time as it was at the place of birth. Daylight saving time and time zone are converted automatically using the official time zone database.',
      },
    ],
  },
  {
    titel: 'Delivery and format',
    fragen: [
      {
        frage: 'How quickly does the horoscope arrive?',
        antwort: `${delivery.sentence('en')} ${delivery.phase === 2 ? 'So it even works as a last-minute gift.' : 'So for an evening gift it is enough to order in good time beforehand.'}`,
      },
      {
        frage: 'What format is the horoscope?',
        antwort: `A PDF of ${site.umfang.en}. ${site.umfangSchwankung.en} It is sent to the email address you give when ordering. You can forward it, print it or read it on a tablet. The cover with the natal chart is designed so that it can also be framed and hung up.`,
      },
      {
        frage: 'Light or dark, which should I choose?',
        antwort:
          'Both editions have the same content and cost the same. The light one is better for printing, the dark one looks particularly calm on screen. For an extra €5 you get both editions. The page “Two editions” shows both side by side to help you decide.',
      },
      {
        frage: 'Can I give the horoscope as a gift?',
        antwort:
          'Yes, that is what it is made for. Enter the birth details of the person you are giving it to and your own email address. You receive the PDF and decide how to present it.',
      },
    ],
  },
  {
    titel: 'Content and creation',
    fragen: [
      {
        frage: 'How is the horoscope created?',
        antwort:
          'First, the positions of the sun, moon and planets at the time and place of birth are calculated. This calculation is astronomically exact. From it, an individual text about personality, strengths and life themes is written, structured in seventeen chapters.',
      },
      {
        frage: 'Is it a prediction?',
        antwort:
          'No. Astrology is a system of interpretation. The horoscope describes tendencies and themes, it does not predict events. It is no substitute for medical, psychological or legal advice.',
      },
      {
        frage: 'Does the horoscope replace an astrologer?',
        antwort:
          'No. Our horoscope is a careful introduction to your own natal chart. A personal session with an experienced astrologer is far more personal and detailed, because questions can be asked, things weighed up and your own situation taken into account. If you enjoyed your horoscope, we expressly recommend this step. More below under “Explained in depth”.',
      },
    ],
  },
  {
    titel: 'Payment and data',
    fragen: [
      {
        frage: 'How can I pay?',
        antwort: `By card, PayPal or Apple Pay. One horoscope costs ${site.priceLabel.en}, light or dark at the same price. Both editions together cost ${site.bothPriceLabel.en}.`,
      },
      {
        frage: 'Can I redeem a voucher?',
        antwort: 'Yes. The cart has a field “Redeem voucher code”. The discount is deducted at checkout.',
      },
      {
        frage: 'Can I cancel my order?',
        antwort:
          'The horoscope is created specifically for you after you order. That is why you agree at checkout that creation begins immediately, and in doing so you waive your right of withdrawal. Details are in the withdrawal policy.',
      },
      {
        frage: 'What happens to the birth details?',
        antwort:
          'They are used only to create the horoscope. How long they are stored and when they are deleted is set out in the privacy policy.',
      },
    ],
  },
];

export const gruppen: Record<Lang, Gruppe[]> = { de, en };
export const alleFragen = (lang: Lang) => gruppen[lang].flatMap((g) => g.fragen);
