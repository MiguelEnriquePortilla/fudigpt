#!/usr/bin/env python3
import os
import re
import json
import datetime
import subprocess
from collections import defaultdict

# Rutas importantes
PROJECT_ROOT = "."
STATUS_REPORT_DIR = "docs"
STATUS_REPORT_FILE = os.path.join(STATUS_REPORT_DIR, "project-status.md")

def get_git_contributors():
    """Obtiene los contribuidores recientes del proyecto desde git"""
    try:
        result = subprocess.run(
            ['git', 'shortlog', '-sne', '--all', '--no-merges', '--since="1 month ago"'],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return "Error al obtener contribuidores desde git"

def get_commit_history():
    """Obtiene el historial de commits recientes"""
    try:
        result = subprocess.run(
            ['git', 'log', '--pretty=format:%ad - %s (%an)', '--date=short', '-n', '10'],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return "Error al obtener el historial de commits"

def count_files_by_type():
    """Cuenta los archivos por tipo de extensión"""
    file_counts = defaultdict(int)
    
    for root, dirs, files in os.walk(PROJECT_ROOT):
        if 'node_modules' in root or '.git' in root:
            continue
            
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext:
                file_counts[ext] += 1
    
    return dict(file_counts)

def get_adr_stats():
    """Obtiene estadísticas sobre los ADRs"""
    adr_dir = "docs/adr"
    if not os.path.exists(adr_dir):
        return "No se encontró el directorio de ADRs"
    
    adr_files = [f for f in os.listdir(adr_dir) 
                if f.endswith('.md') and f != 'README.md' and f != '0000-template.md']
    
    return f"Total de ADRs: {len(adr_files)}"

def get_session_report_stats():
    """Obtiene estadísticas sobre los reportes de sesión"""
    reports_dir = "docs/session-reports"
    if not os.path.exists(reports_dir):
        return "No se encontró el directorio de reportes de sesión"
    
    report_files = [f for f in os.listdir(reports_dir) 
                  if f.endswith('.md') and f != 'README.md']
    
    # Obtener la fecha del reporte más reciente
    latest_date = None
    for report_file in report_files:
        date_match = re.match(r'(\d{4}-\d{2}-\d{2})', report_file)
        if date_match:
            date_str = date_match.group(1)
            try:
                date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
                if latest_date is None or date > latest_date:
                    latest_date = date
            except ValueError:
                continue
    
    latest_report = f"Reporte más reciente: {latest_date}" if latest_date else "No hay reportes con fecha válida"
    return f"Total de reportes: {len(report_files)}, {latest_report}"

def get_firebase_info():
    """Obtiene información de configuración de Firebase"""
    firebase_files = ['.firebaserc', 'firebase.json', 'firestore.rules', 'storage.rules']
    firebase_info = []
    
    for file in firebase_files:
        if os.path.exists(file):
            firebase_info.append(f"✅ {file}")
        else:
            firebase_info.append(f"❌ {file}")
    
    return "\n".join(firebase_info)

def get_component_status():
    """Analiza los componentes principales y su estado"""
    components = {
        'Autenticación': 'contexts/AuthContext.js',
        'Chat Interface': 'pages/ChatPage.js',
        'Conexión con Poster': 'services/poster/',
        'Temas (Claro/Oscuro)': 'contexts/ThemeContext.js',
        'Servicios AI': 'services/ai.js',
    }
    
    status = []
    for name, path in components.items():
        full_path = os.path.join('src', path)
        if os.path.exists(full_path):
            if os.path.isdir(full_path):
                files = os.listdir(full_path)
                status.append(f"✅ {name} ({len(files)} archivos)")
            else:
                status.append(f"✅ {name}")
        else:
            status.append(f"❌ {name} (No encontrado)")
    
    return "\n".join(status)

def generate_status_report():
    """Genera el reporte de estado del proyecto"""
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    
    # Encabezado del reporte
    header = f"""# Reporte de Estado del Proyecto FudiGPT

*Generado automáticamente el: {today}*

Este documento proporciona una visión general del estado actual del proyecto.

"""
    
    # Sección de contribuidores
    contributors_section = """## Contribuidores Recientes

"""
    
    # Sección de actividad reciente
    activity_section = """## Actividad Reciente

"""
    
    # Sección de estadísticas del proyecto
    stats_section = """## Estadísticas del Proyecto

"""
    file_counts = count_files_by_type()
    stats_section += "### Archivos por Tipo\n\n"
    for ext, count in sorted(file_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        stats_section += f"- **{ext}**: {count} archivos\n"
    
    stats_section += f"\n### Documentación\n\n"
    stats_section += f"- {get_adr_stats()}\n"
    stats_section += f"- {get_session_report_stats()}\n\n"
    
    # Sección de componentes
    components_section = """## Estado de Componentes

"""
    components_section += get_component_status()
    components_section += "\n\n"
    
    # Sección de configuración de Firebase
    firebase_section = """## Configuración de Firebase

"""
    firebase_section += get_firebase_info()
    firebase_section += "\n\n"
    
    # Sección de próximos pasos
    next_steps_section = """## Próximos Pasos

Para ver los próximos pasos planificados, consulta:
- [Próximos pasos generales](./next-steps.md)
- [Integración con Poster](./poster-integration.md)

"""
    
    # Pie de página
    footer = """---

*Este reporte se genera automáticamente mediante GitHub Actions. Si detectas información incorrecta, por favor actualiza el script generador.*
"""
    
    # Combinar todas las secciones
    report_content = (
        header + 
        contributors_section + 
        activity_section + 
        stats_section + 
        components_section + 
        firebase_section + 
        next_steps_section + 
        footer
    )
    
    # Escribir el archivo
    with open(STATUS_REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    print(f"Reporte de estado actualizado correctamente.")

if __name__ == "__main__":
    generate_status_report()
    