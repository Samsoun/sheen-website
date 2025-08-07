'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const ImpressumPage = () => {
  return (
    <>
      <div className="datenschutz-container">
        <div className="datenschutz-header">
          <Link href="/" className="back-btn">
            <span className="back-btn-text">← Back to Home</span>
          </Link>
        </div>

        <div className="datenschutz-content">
          <h1>Impressum</h1>

          <h2>Angaben gemäß § 5 TMG:</h2>
          <p>
            Sheen
            <br />
            Inhaberin: Nesa Afshari Khoob
            <br />
            Kurfürstendamm 180
            <br />
            10707 Berlin
          </p>

          <h2>Kontakt:</h2>
          <p>
            Telefon: 0176 32812602
            <br />
            E-Mail: <a href="mailto:kontakt@sheenberlin.de">kontakt@sheenberlin.de</a>
          </p>

          <h2>Umsatzsteuer-ID:</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz: DE358128338</p>

          <h2>Berufsbezeichnung:</h2>
          <p>Kosmetikerin</p>

          <h2>Aufsichtsbehörde:</h2>
          <p>
            Handwerkskammer Berlin
            <br />
            Blücherstraße 68
            <br />
            10961 Berlin
            <br />
            Telefon: 030 25903-01
            <br />
            E-Mail: <a href="mailto:info@hwk-berlin.de">info@hwk-berlin.de</a>
          </p>

          <h2>Berufsrechtliche Regelungen:</h2>
          <p>
            Handwerksordnung (HwO)
            <br />
            einsehbar unter:
            <a
              href="https://www.gesetze-im-internet.de/hwo/"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.gesetze-im-internet.de/hwo/
            </a>
          </p>

          <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</h2>
          <p>
            Nesa Afshari Khoob
            <br />
            Kurfürstendamm 180
            <br />
            10707 Berlin
          </p>

          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
            Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine
            diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten
            Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden
            wir diese Inhalte umgehend entfernen.
          </p>

          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
            übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
            Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
            Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum
            Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der
            verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht
            zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend
            entfernen.
          </p>

          <h2>Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
            der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
            nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf
            dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter
            beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie
            trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
            entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
            Inhalte umgehend entfernen.
          </p>
        </div>
      </div>
    </>
  );
};

export default ImpressumPage;
