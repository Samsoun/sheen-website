"use client";

import React, { useState } from "react";
import {
  testEmailJSConfiguration,
  sendCustomerConfirmation,
  sendAdminNotification,
} from "@/utils/emailService";

export default function TestEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  const handleTestAdmin = async () => {
    setIsLoading(true);
    setTestResult("🧪 Teste Admin-E-Mail...");

    try {
      const success = await testEmailJSConfiguration();
      if (success) {
        setTestResult(
          "✅ Admin-E-Mail-Test erfolgreich! Prüfen Sie Ihr E-Mail-Postfach."
        );
      } else {
        setTestResult(
          "❌ Admin-E-Mail-Test fehlgeschlagen. Prüfen Sie die Console."
        );
      }
    } catch (error) {
      setTestResult("❌ Fehler beim Testen: " + (error as Error).message);
    }

    setIsLoading(false);
  };

  const handleTestCustomer = async () => {
    setIsLoading(true);
    setTestResult("🧪 Teste Kunden-E-Mail...");

    const testBookingData = {
      id: "TEST-" + Date.now(),
      name: "Test Kunde",
      email: "test@example.com",
      phone: "+49 123 456789",
      date: new Date().toISOString().split("T")[0],
      time: "14:00",
      service: "test",
      serviceName: "Augenbrauen zupfen",
      treatments: [
        {
          id: "test1",
          name: "Augenbrauen zupfen",
          duration: 30,
          price: 25,
        },
      ],
      price: 25,
      duration: 30,
      message: "Test-Buchung zur Überprüfung der E-Mail-Funktionalität",
      createdAt: new Date(),
    };

    try {
      const success = await sendCustomerConfirmation(testBookingData);
      if (success) {
        setTestResult(
          "✅ Kunden-E-Mail-Test erfolgreich! Prüfen Sie das E-Mail-Postfach von test@example.com."
        );
      } else {
        setTestResult(
          "❌ Kunden-E-Mail-Test fehlgeschlagen. Prüfen Sie die Console."
        );
      }
    } catch (error) {
      setTestResult("❌ Fehler beim Testen: " + (error as Error).message);
    }

    setIsLoading(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ color: "#333", marginBottom: "2rem" }}>
        📧 EmailJS Test-Seite
      </h1>

      <div
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h3>📋 Aktuelle Konfiguration:</h3>
        <ul>
          <li>
            <strong>Service ID:</strong> service_drz8xtb
          </li>
          <li>
            <strong>Kunde Template:</strong> template_hxneksd
          </li>
          <li>
            <strong>Admin Template:</strong> template_gwjs37v
          </li>
          <li>
            <strong>Public Key:</strong> jjBT0mSIJ15QACfrL
          </li>
        </ul>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
        <button
          onClick={handleTestAdmin}
          disabled={isLoading}
          style={{
            padding: "1rem 2rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          {isLoading
            ? "⏳ Teste..."
            : "🔔 Admin-E-Mail testen (an nesa.afshari@web.de)"}
        </button>

        <button
          onClick={handleTestCustomer}
          disabled={isLoading}
          style={{
            padding: "1rem 2rem",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          {isLoading
            ? "⏳ Teste..."
            : "✅ Kunden-E-Mail testen (an test@example.com)"}
        </button>
      </div>

      {testResult && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: testResult.includes("✅") ? "#d4edda" : "#f8d7da",
            color: testResult.includes("✅") ? "#155724" : "#721c24",
            borderRadius: "8px",
            fontSize: "16px",
          }}
        >
          {testResult}
        </div>
      )}

      <div
        style={{
          marginTop: "3rem",
          padding: "1rem",
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
        }}
      >
        <h3>📝 Anleitung:</h3>
        <ol>
          <li>Klicken Sie auf einen der Test-Buttons</li>
          <li>Prüfen Sie die Browser-Console für Details</li>
          <li>Prüfen Sie Ihr E-Mail-Postfach</li>
          <li>Bei Erfolg: Gehen Sie zur Buchungsseite für echte Tests</li>
        </ol>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#6c757d",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
          }}
        >
          ← Zurück zur Hauptseite
        </a>
      </div>
    </div>
  );
}
