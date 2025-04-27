#!/usr/bin/env python3
import os
import re
from datetime import datetime

REPORTS_DIR = "docs/session-reports"
README_PATH = os.path.join(REPORTS_DIR, "README.md")

# Patrones para extraer información de los reportes
TITLE_PATTERN = re.compile(r'^# Reporte de Avance: (.+?)$', re.MULTILINE)
SUMMARY_PATTERN = re.compile(r'## Resumen Ejecutivo\s+([^\n#]+)', re.IGNORECASE)

def extract_report_info(file_path):
    """Extrae título y enfoque principal de un reporte de sesión"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    title_match = TITLE_PATTERN.search(content)
    summary_match = SUMMARY_PATTERN.search(content)
    
    title = title_match.group(1) if title_match else os.path.basename(file_path).replace('.md', '')
    summary = summary_match.group(1).strip() if summary_match else "No disponible"
    
    # Extraer fecha del nombre del archivo
    date_match = re.match(r'(\d{4}-\d{2}-\d{2})', os.path.basename(file_path))
    date = date_match.group(1) if date_match else "Sin fecha"
    
    return {
        'title': title,
        'summary': summary,
        'date': date,
        'file': os.path.basename(file_path)
    }

def update_reports_index():
    """Actualiza el índice de reportes de sesión en el README.md"""
    # Leer el README actual
    with open(README_PATH, 'r', encoding='utf-8') as f:
        readme_content = f.read()
    
    # Encontrar todos los archivos de reporte
    report_files = [f for f in os.listdir(REPORTS_DIR) 
                  if f.endswith('.md') and f != 'README.md']
    
    # Recolectar información de cada reporte
    reports = []
    for report_file in report_files:
        file_path = os.path.join(REPORTS_DIR, report_file)
        report_info = extract_report_info(file_path)
        reports.append(report_info)
    
    # Ordenar por fecha (más reciente primero)
    reports.sort(key=lambda x: x['date'], reverse=True)
    
    # Crear la tabla de índice
    table_header = """## Índice de Reportes
| Fecha | Sesión | Enfoque Principal |
|-------|--------|-------------------|"""
    
    table_rows = []
    for report in reports:
        title_clean = report['title'].replace('[', '').replace(']', '')
        row = f"| {report['date']} | [{title_clean}](./{report['file']}) | {report['summary'][:50]}... |"
        table_rows.append(row)
    
    table = table_header + "\n" + "\n".join(table_rows)
    
    # Reemplazar la sección de índice en el README
    pattern = r"## Índice de Reportes\s*\|[^|]*\|[^|]*\|[^|]*\|\s*\|[-\s|]*\|(?:\s*\|[^|]*\|[^|]*\|[^|]*\|)*"
    updated_readme = re.sub(pattern, table, readme_content, flags=re.DOTALL)
    
    # Escribir el archivo actualizado
    with open(README_PATH, 'w', encoding='utf-8') as f:
        f.write(updated_readme)
    
    print(f"Índice de reportes de sesión actualizado con {len(reports)} entradas.")

if __name__ == "__main__":
    update_reports_index()