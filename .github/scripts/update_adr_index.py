#!/usr/bin/env python3
import os
import re
from datetime import datetime

ADR_DIR = "docs/adr"
README_PATH = os.path.join(ADR_DIR, "README.md")

# Patrones para extraer información de los ADRs
TITLE_PATTERN = re.compile(r'^# (.+?)$', re.MULTILINE)
STATUS_PATTERN = re.compile(r'## Estado\s+([^\n]+)', re.IGNORECASE)
DATE_PATTERN = re.compile(r'Fecha: (\d{4}-\d{2}-\d{2})', re.IGNORECASE)

def extract_adr_info(file_path):
    """Extrae título, estado y fecha de un ADR"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    title_match = TITLE_PATTERN.search(content)
    status_match = STATUS_PATTERN.search(content)
    date_match = DATE_PATTERN.search(content)
    
    title = title_match.group(1) if title_match else "Sin título"
    status = status_match.group(1) if status_match else "Desconocido"
    date = date_match.group(1) if date_match else "Sin fecha"
    
    return {
        'title': title,
        'status': status,
        'date': date,
        'file': os.path.basename(file_path)
    }

def update_adr_index():
    """Actualiza el índice de ADRs en el README.md"""
    # Leer el README actual
    with open(README_PATH, 'r', encoding='utf-8') as f:
        readme_content = f.read()
    
    # Encontrar todos los archivos ADR
    adr_files = [f for f in os.listdir(ADR_DIR) 
                if f.endswith('.md') and f != 'README.md' and f != '0000-template.md']
    
    # Recolectar información de cada ADR
    adrs = []
    for adr_file in adr_files:
        file_path = os.path.join(ADR_DIR, adr_file)
        adr_info = extract_adr_info(file_path)
        
        # Extraer número del nombre del archivo
        number_match = re.match(r'(\d+)', adr_file)
        if number_match:
            adr_number = int(number_match.group(1))
            adr_info['number'] = adr_number
        else:
            adr_info['number'] = 9999  # Sin número
            
        adrs.append(adr_info)
    
    # Ordenar por número
    adrs.sort(key=lambda x: x['number'])
    
    # Crear la tabla de índice
    table_header = """## Índice de ADRs

| Número | Título | Estado | Fecha |
|--------|--------|--------|-------|"""
    
    table_rows = []
    for adr in adrs:
        number = f"ADR-{adr['number']:03d}" if adr['number'] != 9999 else "Sin número"
        row = f"| [{number}](./{adr['file']}) | {adr['title']} | {adr['status']} | {adr['date']} |"
        table_rows.append(row)
    
    table = table_header + "\n" + "\n".join(table_rows)
    
    # Reemplazar la sección de índice en el README
    pattern = r"## Índice de ADRs\s*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*\|[-\s|]*\|(?:\s*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|)*"
    updated_readme = re.sub(pattern, table, readme_content, flags=re.DOTALL)
    
    # Escribir el archivo actualizado
    with open(README_PATH, 'w', encoding='utf-8') as f:
        f.write(updated_readme)
    
    print(f"Índice de ADRs actualizado con {len(adrs)} entradas.")

if __name__ == "__main__":
    update_adr_index()