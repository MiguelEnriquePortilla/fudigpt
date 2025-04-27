#!/usr/bin/env python3
import os
import re
import datetime

# Rutas a diferentes secciones del proyecto
PROJECT_ROOT = "."
README_PATH = os.path.join(PROJECT_ROOT, "README.md")
ADR_DIR = "docs/adr"
SESSION_REPORTS_DIR = "docs/session-reports"
SRC_DIR = "src"

def get_project_description():
    """Extrae la descripción del proyecto del archivo FudiGPT — Declaración de Producto"""
    description = """
# FudiGPT

FudiGPT es un gerente operativo con superpoderes, listo para actuar 24/7 en el corazón del restaurante.

## ¿Qué es FudiGPT?

FudiGPT es un asistente AI entrenado para conversar, entender y resolver problemas reales en restaurantes — desde costos de insumos hasta desempeño de platillos. Se conecta directo al POS (como Poster), analiza datos reales tal como vienen, y responde con empatía, claridad y estrategia.

Donde otros bots se rompen, FudiGPT propone.
Donde otros exigen datos limpios, FudiGPT se adapta.
Donde otros entregan dashboards, FudiGPT conversa con inteligencia.
"""
    return description

def get_latest_adrs(count=3):
    """Obtiene los ADRs más recientes"""
    adrs = []
    adr_files = [f for f in os.listdir(ADR_DIR) 
                if f.endswith('.md') and f != 'README.md' and f != '0000-template.md']
    
    for adr_file in adr_files:
        with open(os.path.join(ADR_DIR, adr_file), 'r', encoding='utf-8') as f:
            content = f.read()
            
        title_match = re.search(r'^# (.+?)$', content, re.MULTILINE)
        date_match = re.search(r'Fecha: (\d{4}-\d{2}-\d{2})', content, re.IGNORECASE)
        
        title = title_match.group(1) if title_match else "Sin título"
        date = date_match.group(1) if date_match else "Sin fecha"
        
        adrs.append({
            'title': title,
            'date': date,
            'file': adr_file
        })
    
    # Ordenar por fecha (más reciente primero)
    adrs.sort(key=lambda x: x['date'], reverse=True)
    return adrs[:count]

def get_latest_session_reports(count=3):
    """Obtiene los reportes de sesión más recientes"""
    reports = []
    report_files = [f for f in os.listdir(SESSION_REPORTS_DIR) 
                  if f.endswith('.md') and f != 'README.md']
    
    for report_file in report_files:
        date_match = re.match(r'(\d{4}-\d{2}-\d{2})', report_file)
        date = date_match.group(1) if date_match else "Sin fecha"
        
        with open(os.path.join(SESSION_REPORTS_DIR, report_file), 'r', encoding='utf-8') as f:
            content = f.read()
            
        title_match = re.search(r'^# Reporte de Avance: (.+?)$', content, re.MULTILINE)
        title = title_match.group(1) if title_match else report_file.replace('.md', '')
        
        reports.append({
            'title': title,
            'date': date,
            'file': report_file
        })
    
    # Ordenar por fecha (más reciente primero)
    reports.sort(key=lambda x: x['date'], reverse=True)
    return reports[:count]

def get_project_structure():
    """Obtiene una descripción de la estructura del proyecto"""
    structure = """
## Estructura del Proyecto

- **src/**: Código fuente de la aplicación React
  - **components/**: Componentes reutilizables de UI
  - **contexts/**: Contextos de React (autenticación, tema, etc.)
  - **pages/**: Páginas principales de la aplicación
  - **services/**: Servicios para integración con APIs externas
  - **utils/**: Utilidades y funciones auxiliares
- **docs/**: Documentación del proyecto
  - **adr/**: Registro de Decisiones Arquitectónicas
  - **session-reports/**: Reportes de sesiones de desarrollo
- **functions/**: Cloud Functions para Firebase
- **poster-sync/**: Servicios para sincronización con Poster POS
"""
    return structure

def get_deployment_info():
    """Obtiene información sobre el despliegue"""
    deployment = """
## Despliegue

El proyecto se despliega automáticamente en Firebase Hosting a través de GitHub Actions cuando se hace push a la rama master.

URL de producción: https://fudigpt.com
"""
    return deployment

def generate_readme():
    """Genera el contenido del README principal"""
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    
    # Secciones del README
    header = f"""# FudiGPT - Documentación Principal

*Última actualización: {today}*

Este documento proporciona un resumen actualizado del estado del proyecto FudiGPT.
"""
    
    description = get_project_description()
    
    # Sección de ADRs recientes
    latest_adrs = get_latest_adrs()
    adrs_section = """
## Decisiones Arquitectónicas Recientes

"""
    for adr in latest_adrs:
        adrs_section += f"- **{adr['date']}**: [{adr['title']}](docs/adr/{adr['file']})\n"
    
    adrs_section += "\n[Ver todas las decisiones arquitectónicas](docs/adr/README.md)\n"
    
    # Sección de reportes recientes
    latest_reports = get_latest_session_reports()
    reports_section = """
## Reportes de Sesión Recientes

"""
    for report in latest_reports:
        reports_section += f"- **{report['date']}**: [{report['title']}](docs/session-reports/{report['file']})\n"
    
    reports_section += "\n[Ver todos los reportes de sesión](docs/session-reports/README.md)\n"
    
    # Sección de estructura del proyecto
    structure = get_project_structure()
    
    # Sección de despliegue
    deployment = get_deployment_info()
    
    # Sección de próximos pasos
    next_steps = """
## Próximos Pasos

Consulta los siguientes archivos para obtener información detallada sobre los próximos pasos:

- [Próximos pasos generales](docs/next-steps.md)
- [Plan de integración con Poster](docs/poster-integration.md)
"""
    
    # Pie de página
    footer = """
---

Para contribuir al proyecto, por favor consulta [CONTRIBUTING.md](.github/CONTRIBUTING.md).
"""
    
    # Combinar todas las secciones
    readme_content = header + description + adrs_section + reports_section + structure + deployment + next_steps + footer
    
    # Escribir el archivo
    with open(README_PATH, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"README principal actualizado correctamente.")

if __name__ == "__main__":
    generate_readme()