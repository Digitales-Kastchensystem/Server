<p align="center">
  <img src="public/logo.png" alt="Logo" height="200">
</p>



<p align="center">
  <h1 align="center">Digitales Kästchensystem Server</h1>
  Digitales Kästchensystem ist ein innovatives System für Schulen mit Nachmittagsunterricht. Schüler können ihren eigenen Nachmittagsplan erstellen und verwalten, während Lehrer und Administratoren wertvolle Einblicke in den Fortschritt jedes Schülers erhalten. Das System sammelt Statistiken zu den Aktivitäten jedes Schülers. Mit der einfachen Benutzeroberfläche und automatisierten Funktionen sparen Lehrer und Administratoren Zeit, während Schüler ihr eigenes Lern- und Freizeitmanagement verbessern können.
</p>

## Über dieses Repository

Hier finden sie den Quellcode für den Server des Kästchensystems. Dieser Server ist für die Verwaltung der Datenbank und die Kommunikation mit den Clients zuständig. Hier ist keine Benutzeroberfläche enthalten. Für die Benutzeroberfläche besuchen Sie bitte das [Web-Repository](https://github.com/Digitales-Kastchensystem/Web).

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
    - [Logging](#Log-Konfiguration)
4. [Starten des Servers](#Starten-des-Servers)


### Voraussetzungen
- [Node.js Runtime](https://nodejs.org/en/) (Version 18.0.0 oder höher)
- [NPM](https://www.npmjs.com/) (Version 7.0.0 oder höher)
- [MySQL Datenbank](https://www.mysql.com/) (Version 1.0.0 oder höher)
- Statische IP-Adresse (Empfohlen)

Es ist empfehlenswert, den Server auf einem Linux-Server zu installieren. Die Installation auf einem Windows-Server ist ebenfalls möglich, jedoch nicht getestet und auf eigene Gefahr.


#### Clonen des Quellcodes
```bash
git clone https://github.com/Digitales-Kastchensystem/Server.git
```

#### Compilieren des Quellcodes
1. Installation der Abhängigkeiten
```bash
make install-deps
```

2. Kompilieren des Quellcodes
```bash
npm build
```

3. Sie können alle Schritte mit einem Befehl ausführen:
```bash
make
```

4. Vor dem Starten des Servers müssen Sie die Konfiguration anpassen. (Siehe [Konfigurieren des Servers](#Konfigurieren-des-Servers))
Sie müssen vor allem die Datenbankk vorbereiten. Dazu müssen Sie die `Database.sql` Datei in Ihre Datenbank importieren.
Es is empfehlenswert, eine Datenbank Oberfläche wie [phpMyAdmin](https://www.phpmyadmin.net/) zu verwenden.

Die Kompilierte Anwendung befindet sich im Ordner `./build`.

### Konfigurieren des Servers
Öffnen Sie die Datei `./build/config.cfg` in einem Texteditor. Und passen Sie die Konfiguration an Ihre Bedürfnisse an.
Mehr zu den einzelnen Konfigurationsoptionen finden Sie in der [Konfigurationsdokumentation](#Konfigurieren).


### Starten des Servers
```bash 
bash ./build/start.sh
```

###Erste anmeldung
Nachdem Sie den Server gestartet haben, können Sie sich mit dem Benutzer `admin` und dem Passwort `admin` anmelden.
> **Warning** Die Für die Anmeldung muss die Benutzeroberfläche installiert sein. (Siehe [Web-Repository](https://github.com/Digitales-Kastchensystem/Web))


## Konfigurieren
Die Konfigurationsdatei `config.cfg` enthält Einstellungen für das System für digitales Zeitmanagement und digitale Kästchenverwaltung. Die Konfigurationsparameter sind wie folgt:



### Allgemeine Serverkonfiguration


- `interface`: Die IP-Adresse, auf der der Server lauscht. Der Standardwert "0.0.0.0" bedeutet, dass der Server auf allen Netzwerk-Interfaces verfügbar ist.
- `port`: Der Port, auf dem der Server lauscht.



### Datenbankkonfiguration

- `host`: Die IP-Adresse oder der Hostname des Datenbankservers (mysql Datenbank. z.B. MariaDB).
- `port`: Der Port, auf dem die Datenbank läuft.
- `username`: Der Benutzername, mit dem auf die Datenbank zugegriffen werden soll.
- `password`: Das Passwort für den Benutzer.



### Schuldaten

- `school_name`: Der Name der Schule.
- `school_web_name`: Der Name der Schule, wie er auf der Website angezeigt wird. (Kann HTML-Code enthalten)
- `school_web_url`: Die URL der Schulwebsite.
- `school_logo`: Der relative Pfad zum Schullogo.



- `admin_email`: Die E-Mail-Adresse des Administrators. (Wird bei Serverausfällen als Kontaktadresse verwendet)



### Supplierung

- `email_regex`: Gibt an, welchem Muster E-Mail-Adressen für Supplierlehrer entsprechen müssen.

### Log-Konfiguration

- `log_file`: Der Dateipfad für das Log-File.
- `log_format`: Das Format für Log-Einträge.

## Konfiguration für Zeitmanagement
Die Konfigurationsdatei `TimeTableConfig.json` enthält die Zeitplaneinstellungen, Zeitkästchen und Farbenkonfiguration:

- `IgnoreCapitalLetters`: Gibt an, ob Groß- und Kleinschreibung beim ausrechnen von Schülerstatistiken ignoriert werden soll.
  - Zum Beispiel: STD und Std werden gleich als Studium gezählt.
- `IgnoreSpaces`: Gibt an, ob Leerzeichen beim ausrechnen von Schülerstatistiken ignoriert werden soll.
  - Zum Beispiel: Studium und Studi um werden gleich als Studium gezählt.
- `IgnoreBracketsContent`: Gibt an, ob der Inhalt von Klammern beim ausrechnen von Schülerstatistiken ignoriert werden soll.
  - Zum Beispiel: Studium (WPF) und Studium (Nachhilfe) werden gleich als Studium gezählt.

- `Studium`: Farb- und Markereinstellungen für das Studium.
  - Aus Start- und Endcolor wird vom ui ein gradient generiert.
  - `Cells`: Ist die Liste der Inhalte der Zeitkästchen, die als Studium gezählt werden sollen.

- `Ausgang`: Farb- und Markereinstellungen für das Ausgangszeitkästchen.
  - Aus Start- und Endcolor wird vom ui ein gradient generiert.
  - `Cells`: Ist die Liste der Inhalte der Zeitkästchen, die als Ausgang gezählt werden sollen.

- `Colours`: Liste der Inhalte der Zeitkästchen, die mit jeweiligem gradient markiert werden sollen.
  - `Cells`: Der Name des Zeitkästchens.
  - `StartColor`: Die Startfarbe des gradients.
  - `EndColor`: Die Endfarbe des gradients.

- `Days`: Liste der Wochentage, an denen das Zeitmanagement aktiv ist.

- `Units`: Liste der Zeitkästchen, die in der Zeitplanung angezeigt werden sollen.
  - `Start`: Die Startzeit des Zeitkästchens.
  - `End`: Die Endzeit des Zeitkästchens.