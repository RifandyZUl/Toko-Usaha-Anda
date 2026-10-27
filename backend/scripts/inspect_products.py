import openpyxl
import json

wb = openpyxl.load_workbook('Daftar_Produk.xlsx')
sheet = wb.active
rows = list(sheet.iter_rows(values_only=True))

items = []
for r in rows[1:]:
    if any(r):
        items.append({
            'no': r[0],
            'name': r[1],
            'category': r[2],
            'brand': r[3],
            'color': r[4],
            'specs': r[5],
            'desc': r[6],
            'features': r[7],
            'price': r[8]
        })

cats = sorted(list(set(item['category'] for item in items)))
print(f'Total items: {len(items)}')
print(f'Total categories: {len(cats)}')

for c in cats:
    cat_items = [it for it in items if it['category'] == c]
    print(f'\n--- Kategori: {c} ({len(cat_items)} item) ---')
    for it in cat_items:
        print(f"  [{it['no']}] {it['name']} | Merek: {it['brand']} | Rp{it['price']}")
