<p align="center">
  <img src="public/logo.png" alt="Logo" height="200">
</p>



<p align="center">
  <h1 align="center">Digitales Kästchensystem Server</h1>
  Digitales Kästchensystem ist ein innovatives System für Schulen mit Nachmittagsunterricht. Schüler können ihren eigenen Nachmittagsplan erstellen und verwalten, während Lehrer und Administratoren wertvolle Einblicke in den Fortschritt jedes Schülers erhalten. Das System sammelt Statistiken zu den Aktivitäten jedes Schülers und bietet gezielte Unterstützung, wo sie benötigt wird. Mit der einfachen Benutzeroberfläche und automatisierten Funktionen sparen Lehrer und Administratoren Zeit, während Schüler ihr eigenes Lern- und Freizeitmanagement verbessern können.
</p>

## Über dieses Repository

In dieser Repository finden Sie den Quellcode für den Kästchensystem-Server, der es Schulen ermöglicht, ihre eigene Instanz des Kästchensystems zu installieren und zu verwalten. Der Quellcode ist in einer gut strukturierten Weise organisiert, so dass Schulen ihn leicht verstehen und an ihre spezifischen Bedürfnisse anpassen können.

Die Installation des Kästchensystem-Servers ist einfach und unkompliziert. Die Schulen können den Server auf einer Vielzahl von Plattformen wie Linux, macOS oder Windows installieren. Die Installation des Servers ermöglicht den Schulen eine vollständige Kontrolle über die Verwaltung ihrer Schülerdaten.

Das Kästchensystem sammelt und speichert Schülerdaten auf dem Schulserver, um die Verwaltung des Nachmittagsunterrichts zu erleichtern. Der Datenschutz ist ein wichtiger Aspekt des Kästchensystems. Die Schülerdaten werden auf dem Schulserver gespeichert und die Schulen sind dafür verantwortlich, sicherzustellen, dass Datenschutzbestimmungen eingehalten werden.

Zusammenfassend bietet diese Repository eine Möglichkeit für Schulen, ihre eigene Instanz des Kästchensystems zu installieren und zu verwalten. Der Quellcode ist leicht zu verstehen und anpassbar. Die Datenschutzbestimmungen werden eingehalten, indem Schülerdaten auf dem Schulserver gespeichert werden.

## Installation aus Quellcode
Die Installation des Kästchensystem-Servers verlangt das Herunterladen und das Compilieren des Quellcodes für die jeweilige Plattform.

> **Warning**
> Für produktive Umgebungen wird empfohlen, die [Docker-Installation](#Installation-mit-Docker) zu verwenden. Die Version aus Quellcode kann instabil sein!


Die Installation besteht aus folgenden Schritten:

1. [Herunterladen des Quellcodes](#Herunterladen-des-Quellcodes)
    - [Clonen des Quellcodes](#Clonen-des-Quellcodes)
2. [Compilieren des Quellcodes](#Compilieren-des-Quellcodes)
3. [Konfigurieren des Servers](#Konfigurieren-des-Servers)
    - [Allgemeine Serverkonfiguration](#Allgemeine-Serverkonfiguration)
    - [Datenbankkonfiguration](#Datenbankkonfiguration)
    - [Schuldaten](#Schuldaten)
    - [Sicherheit](#Sicherheit)
    - [Logging](#Log-Konfiguration)
4. [Starten des Servers](#Starten-des-Servers)


### Voraussetzungen
- [Node.js](https://nodejs.org/en/) (Version 18.0.0 oder höher)
- [NPM](https://www.npmjs.com/) (Version 7.0.0 oder höher)
- [SurrealDB](https://surrealdb.com/) (Version 1.0.0 oder höher)
- Statische IP-Adresse (Empfohlen)

Es ist empfehlenswert, den Server auf einem Linux-Server zu installieren. Die Installation auf einem Windows-Server ist ebenfalls möglich, jedoch nicht getestet und auf eigene Gefahr.


#### Clonen des Quellcodes
```bash
git clone https://github.com/Digitales-Kastchensystem/Server.git
```

#### Compilieren des Quellcodes
1. Installation der Abhängigkeiten
```bash
npm install
```

2. Kompilieren des Quellcodes
```bash
npm run build
```

Die Kompilierte Anwendung befindet sich im Ordner `./dist`.

### Konfigurieren des Servers
Öffnen Sie die Datei `./dist/config.cfg` in einem Texteditor. Und passen Sie die Konfiguration an Ihre Bedürfnisse an.
Mehr zu den einzelnen Konfigurationsoptionen finden Sie in der [Konfigurationsdokumentation](#Konfigurieren).



### Starten des Servers
```bash 
bash ./dist/start.sh
```



## Konfigurieren
Die Konfigurationsdatei `config.cfg` enthält Einstellungen für das System für digitales Zeitmanagement und digitale Kästchenverwaltung. Die Konfigurationsparameter sind wie folgt:



### Allgemeine Serverkonfiguration


- `interface`: Die IP-Adresse, auf der der Server lauscht. Der Standardwert "0.0.0.0" bedeutet, dass der Server auf allen Netzwerk-Interfaces verfügbar ist.
- `port`: Der Port, auf dem der Server lauscht.



### Datenbankkonfiguration

- `host`: Die IP-Adresse oder der Hostname des Datenbankservers (SurrealDB)
- `port`: Der Port, auf dem die Datenbank läuft.
- `username`: Der Benutzername, mit dem auf die Datenbank zugegriffen werden soll.
- `password`: Das Passwort für den Benutzer.



### Schuldaten

- `school_name`: Der Name der Schule.
- `school_web_name`: Der Name der Schule, wie er auf der Website angezeigt wird. (Kann HTML-Code enthalten)
- `school_web_url`: Die URL der Schulwebsite.
- `school_logo`: Der relative Pfad zum Schullogo.



- `admin_email`: Die E-Mail-Adresse des Administrators. (Wird bei Serverausfällen als Kontaktadresse verwendet)



### Sicherheit

- `allow_password_reset`: Gibt an, ob Passwort-Reset-Funktionen verfügbar sein sollen.
- `allow_substitute_teacher`: Gibt an, ob ein Lehrer einen Vertretungslehrer ernennen kann.
- `allow_substitute_teacher_edit`: Gibt an, ob der Vertretungslehrer den Stundenplan bearbeiten kann.
- `allow_teacher_view_all`: Gibt an, ob alle Lehrer alle Stundenpläne sehen können.
- `allow_teacher_edit_all`: Gibt an, ob alle Lehrer alle Stundenpläne bearbeiten können.



### Log-Konfiguration

- `log_file`: Der Dateipfad für das Log-File.
- `log_format`: Das Format für Log-Einträge.