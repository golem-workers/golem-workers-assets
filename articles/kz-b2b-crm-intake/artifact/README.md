# CRM intake pilot: practical artifact / Практический пакет / Практикалық пакет

Synthetic example only. No customer data, live CRM, model extraction or network writes. / Все данные условные; пример не обращается к CRM и модели. / Барлық дерек синтетикалық; CRM мен модельге сұрау жасалмайды.

- [Русский: паспорт пилота](pilot-template.ru.md), [карта-пример](field-map-example.ru.csv), [пустая карта](field-map-blank.ru.csv)
- [Қазақша: пилот үлгісі](pilot-template.kk.md), [толтырылған карта](field-map-example.kk.csv), [бос карта](field-map-blank.kk.csv)
- [English: pilot brief](pilot-template.en.md), [example field map](field-map-example.en.csv), [blank field map](field-map-blank.en.csv)

Run `python3 intake_fixture.py` next to `acceptance-cases.json`: eight local expected decisions, not a test of AI accuracy or a production adapter. `synthetic-input.json` shows the artificial request. The policy does not supply durable storage, concurrent-write locking, version-specific API requests or distributed exactly-once guarantees. Unknown write outcomes must be reconciled by the actual integration before retrying.
