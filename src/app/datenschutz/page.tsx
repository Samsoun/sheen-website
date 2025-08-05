'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

const DatenschutzPage = () => {
  return (
    <>
      <div className="datenschutz-container">
        <div className="datenschutz-header">
          <Link href="/" className="back-btn">
            <span className="back-btn-text">← Back to Home</span>
          </Link>
        </div>

        <div className="datenschutz-content">
          <h1>Datenschutzerklärung</h1>

          <h2>Einleitung</h2>
          <p>
            Wir freuen uns über Ihr Interesse an unserem Unternehmen und unseren Dienstleistungen.
            Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. In dieser
            Datenschutzerklärung informieren wir Sie über die Art, den Umfang und Zweck der Erhebung
            und Verwendung personenbezogener Daten auf unserer Website
            <a href="https://sheenberlin.de"> https://sheenberlin.de</a>.
          </p>

          <h2>Verantwortlicher</h2>
          <div className="contact-info">
            <p>
              Samsoun Behaein
              <br />
              Grünhofer Weg 42
              <br />
              13581 Berlin
              <br />
              Telefon: 0157 55664185
              <br />
              E-Mail:
              <a href="mailto:kontakt@sheenberlin.de"> kontakt@sheenberlin.de</a>
            </p>
          </div>

          <h2>
            Erhebung und Speicherung personenbezogener Daten sowie Art und Zweck von deren
            Verwendung
          </h2>
          <h3>1. Beim Besuch der Website</h3>
          <p>
            Beim Aufrufen unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden
            Browser automatisch Informationen an den Server unserer Website gesendet. Diese
            Informationen werden temporär in einem sogenannten Logfile gespeichert. Folgende
            Informationen werden dabei ohne Ihr Zutun erfasst und bis zur automatisierten Löschung
            gespeichert:
          </p>
          <ul>
            <li>IP-Adresse des anfragenden Rechners,</li>
            <li>Datum und Uhrzeit des Zugriffs,</li>
            <li>Name und URL der abgerufenen Datei,</li>
            <li>Website, von der aus der Zugriff erfolgt (Referrer-URL),</li>
            <li>
              verwendeter Browser und ggf. das Betriebssystem Ihres Rechners sowie der Name Ihres
              Access-Providers.
            </li>
          </ul>
          <p>Die genannten Daten werden durch uns zu folgenden Zwecken verarbeitet:</p>
          <ul>
            <li>Gewährleistung eines reibungslosen Verbindungsaufbaus der Website,</li>
            <li>Gewährleistung einer komfortablen Nutzung unserer Website,</li>
            <li>Auswertung der Systemsicherheit und -stabilität sowie</li>
            <li>zu weiteren administrativen Zwecken.</li>
          </ul>
          <p>
            Die Rechtsgrundlage für die Datenverarbeitung ist Art. 6 Abs. 1 S. 1 lit. f DSGVO. Unser
            berechtigtes Interesse folgt aus oben aufgelisteten Zwecken zur Datenerhebung. In keinem
            Fall verwenden wir die erhobenen Daten zu dem Zweck, Rückschlüsse auf Ihre Person zu
            ziehen.
          </p>

          <h3>2. Bei Nutzung unseres Kontaktformulars</h3>
          <p>
            Bei Fragen jeglicher Art bieten wir Ihnen die Möglichkeit, mit uns über ein auf der
            Website bereitgestelltes Formular Kontakt aufzunehmen. Dabei ist die Angabe Ihres Namens
            und einer gültigen E-Mail-Adresse erforderlich, damit wir wissen, von wem die Anfrage
            stammt und um diese beantworten zu können. Weitere Angaben können freiwillig getätigt
            werden.
          </p>
          <p>
            Die Datenverarbeitung zum Zwecke der Kontaktaufnahme mit uns erfolgt nach Art. 6 Abs. 1
            S. 1 lit. a DSGVO auf Grundlage Ihrer freiwillig erteilten Einwilligung.
          </p>
          <p>
            Die für die Benutzung des Kontaktformulars von uns erhobenen personenbezogenen Daten
            werden nach Erledigung der von Ihnen gestellten Anfrage automatisch gelöscht.
          </p>

          <h2>Weitergabe von Daten</h2>
          <p>
            Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den im Folgenden
            aufgeführten Zwecken findet nicht statt.
          </p>
          <p>Wir geben Ihre persönlichen Daten nur an Dritte weiter, wenn:</p>
          <ul>
            <li>
              Sie Ihre nach Art. 6 Abs. 1 S. 1 lit. a DSGVO ausdrückliche Einwilligung dazu erteilt
              haben,
            </li>
            <li>
              die Weitergabe nach Art. 6 Abs. 1 S. 1 lit. f DSGVO zur Geltendmachung, Ausübung oder
              Verteidigung von Rechtsansprüchen erforderlich ist und kein Grund zur Annahme besteht,
              dass Sie ein überwiegendes schutzwürdiges Interesse an der Nichtweitergabe Ihrer Daten
              haben,
            </li>
            <li>
              für den Fall, dass für die Weitergabe nach Art. 6 Abs. 1 S. 1 lit. c DSGVO eine
              gesetzliche Verpflichtung besteht, sowie
            </li>
            <li>
              dies gesetzlich zulässig und nach Art. 6 Abs. 1 S. 1 lit. b DSGVO für die Abwicklung
              von Vertragsverhältnissen mit Ihnen erforderlich ist.
            </li>
          </ul>

          <h2 id="cookies-section">Cookies</h2>
          <p>
            Unsere Website verwendet Cookies. Hierbei handelt es sich um kleine Dateien, die Ihr
            Browser automatisch erstellt und die auf Ihrem Endgerät (Laptop, Tablet, Smartphone
            o.ä.) gespeichert werden, wenn Sie unsere Seite besuchen. Cookies richten auf Ihrem
            Endgerät keinen Schaden an, enthalten keine Viren, Trojaner oder sonstige Schadsoftware.
          </p>
          <p>
            In dem Cookie werden Informationen abgelegt, die sich jeweils im Zusammenhang mit dem
            spezifisch eingesetzten Endgerät ergeben. Dies bedeutet jedoch nicht, dass wir dadurch
            unmittelbar Kenntnis von Ihrer Identität erhalten.
          </p>
          <p>
            Der Einsatz von Cookies dient einerseits dazu, die Nutzung unseres Angebots für Sie
            angenehmer zu gestalten. So setzen wir sogenannte Session-Cookies ein, um zu erkennen,
            dass Sie einzelne Seiten unserer Website bereits besucht haben. Diese werden nach
            Verlassen unserer Seite automatisch gelöscht.
          </p>
          <p>
            Darüber hinaus setzen wir ebenfalls zur Optimierung der Benutzerfreundlichkeit temporäre
            Cookies ein, die für einen bestimmten festgelegten Zeitraum auf Ihrem Endgerät
            gespeichert werden. Besuchen Sie unsere Seite erneut, um unsere Dienste in Anspruch zu
            nehmen, wird automatisch erkannt, dass Sie bereits bei uns waren und welche Eingaben und
            Einstellungen Sie getätigt haben, um diese nicht noch einmal eingeben zu müssen.
          </p>
          <p>
            Zum anderen setzten wir Cookies ein, um die Nutzung unserer Website statistisch zu
            erfassen und zum Zwecke der Optimierung unseres Angebotes für Sie auszuwerten. Diese
            Cookies ermöglichen es uns, bei einem erneuten Besuch unserer Seite automatisch zu
            erkennen, dass Sie bereits bei uns waren. Diese Cookies werden nach einer jeweils
            definierten Zeit automatisch gelöscht.
          </p>
          <p>
            Die durch Cookies verarbeiteten Daten sind für die genannten Zwecke zur Wahrung unserer
            berechtigten Interessen sowie der Dritter nach Art. 6 Abs. 1 S. 1 lit. f DSGVO
            erforderlich.
          </p>

          <h2>Analyse-Tools</h2>
          <p>
            Die im Folgenden aufgeführten und von uns eingesetzten Tracking-Maßnahmen werden auf
            Grundlage des Art. 6 Abs. 1 S. 1 lit. f DSGVO durchgeführt. Mit den zum Einsatz
            kommenden Tracking-Maßnahmen wollen wir eine bedarfsgerechte Gestaltung und die
            fortlaufende Optimierung unserer Website sicherstellen. Zum anderen setzen wir die
            Tracking-Maßnahmen ein, um die Nutzung unserer Website statistisch zu erfassen und zum
            Zwecke der Optimierung unseres Angebotes für Sie auszuwerten. Diese Interessen sind als
            berechtigt im Sinne der vorgenannten Vorschrift anzusehen.
          </p>

          <h2>Betroffenenrechte</h2>
          <p>Sie haben das Recht:</p>
          <ul>
            <li>
              gemäß Art. 15 DSGVO Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten
              zu verlangen. Insbesondere können Sie Auskunft über die Verarbeitungszwecke, die
              Kategorie der personenbezogenen Daten, die Kategorien von Empfängern, gegenüber denen
              Ihre Daten offengelegt wurden oder werden, die geplante Speicherdauer, das Bestehen
              eines Rechts auf Berichtigung, Löschung, Einschränkung der Verarbeitung oder
              Widerspruch, das Bestehen eines Beschwerderechts, die Herkunft ihrer Daten, sofern
              diese nicht bei uns erhoben wurden, sowie über das Bestehen einer automatisierten
              Entscheidungsfindung einschließlich Profiling und ggf. aussagekräftigen Informationen
              zu deren Einzelheiten verlangen;
            </li>
            <li>
              gemäß Art. 16 DSGVO unverzüglich die Berichtigung unrichtiger oder Vervollständigung
              Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen;
            </li>
            <li>
              gemäß Art. 17 DSGVO die Löschung Ihrer bei uns gespeicherten personenbezogenen Daten
              zu verlangen, soweit nicht die Verarbeitung zur Erfüllung einer rechtlichen
              Verpflichtung erforderlich ist;
            </li>
            <li>
              gemäß Art. 18 DSGVO die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten
              zu verlangen, soweit die Richtigkeit der Daten von Ihnen bestritten wird oder die
              Verarbeitung unrechtmäßig ist;
            </li>
            <li>
              gemäß Art. 20 DSGVO Ihre personenbezogenen Daten, die Sie uns bereitgestellt haben, in
              einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten oder die
              Übermittlung an einen anderen Verantwortlichen zu verlangen;
            </li>
            <li>
              gemäß Art. 21 DSGVO Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten
              einzulegen, sofern die Verarbeitung aufgrund von berechtigten Interessen erfolgt; und
            </li>
            <li>gemäß Art. 77 DSGVO sich bei einer Aufsichtsbehörde zu beschweren.</li>
          </ul>

          <h2>Datensicherheit</h2>
          <p>
            Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket
            Layer) in Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem
            Browser unterstützt wird. In der Regel handelt es sich dabei um eine 256 Bit
            Verschlüsselung. Falls Ihr Browser keine 256-Bit Verschlüsselung unterstützt, greifen
            wir stattdessen auf 128-Bit v3 Technologie zurück. Ob eine einzelne Seite unseres
            Internetauftrittes verschlüsselt übertragen wird, erkennen Sie an der geschlossenen
            Darstellung des Schloß-Symbols in der unteren Statusleiste Ihres Browsers.
          </p>
          <p>
            Wir bedienen uns im Übrigen geeigneter technischer und organisatorischer
            Sicherheitsmaßnahmen, um Ihre Daten gegen zufällige oder vorsätzliche Manipulationen,
            teilweisen oder vollständigen Verlust, Zerstörung oder gegen den unbefugten Zugriff
            Dritter zu schützen. Unsere Sicherheitsmaßnahmen werden entsprechend der technologischen
            Entwicklung fortlaufend verbessert.
          </p>

          <h2>Aktualität und Änderung dieser Datenschutzerklärung</h2>
          <p>Diese Datenschutzerklärung ist aktuell gültig und hat den Stand Mai 2023.</p>
          <p>
            Durch die Weiterentwicklung unserer Website und Angebote darüber oder aufgrund
            geänderter gesetzlicher beziehungsweise behördlicher Vorgaben kann es notwendig werden,
            diese Datenschutzerklärung zu ändern. Die jeweils aktuelle Datenschutzerklärung kann
            jederzeit auf der Website unter
            <a href="https://sheenberlin.de/datenschutz"> https://sheenberlin.de/datenschutz</a>
            von Ihnen abgerufen und ausgedruckt werden.
          </p>
        </div>
      </div>
    </>
  );
};

export default DatenschutzPage;
