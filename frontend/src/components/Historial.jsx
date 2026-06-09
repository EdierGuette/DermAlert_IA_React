import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import AuthModal from './AuthModal';

// Importar CSS
import '../css/historial/total_diagnostics.css';
import '../css/historial/filtro_busqueda_id_cedula.css';
import '../css/historial/filtro_mostrar.css';
import '../css/historial/tabla.css';

// Mapeo de clases a códigos CIE-10
const cie10Mapping = {
  'Benigno General': 'D23.9',
  'Nevo Lunar': 'D22.9',
  'Dermatofibroma': 'D23.9',
  'Queratosis Seborreica': 'L82',
  'Melanoma': 'C43.9',
  'Carcinoma Basocelular': 'C44.9',
  'Carcinoma Escamocelular': 'C44.9',
  'Premaligno': 'L57.0',
  'Desconocido': 'R22.9'
};

// Función para obtener el nivel de riesgo
const getRiskLevel = (categoria) => {
  switch (categoria) {
    case 'Maligno': return { text: 'Alto', class: 'risk-badge-high', icon: '🔴' };
    case 'Premaligno': return { text: 'Moderado', class: 'risk-badge-moderate', icon: '🟠' };
    case 'Benigno': return { text: 'Bajo', class: 'risk-badge-low', icon: '🟢' };
    default: return { text: 'No determinado', class: 'risk-badge-unknown', icon: '⚪' };
  }
};

const getCategoryBadgeClass = (categoria) => {
  switch (categoria) {
    case 'Maligno': return 'category-badge-maligno';
    case 'Benigno': return 'category-badge-benigno';
    case 'Premaligno': return 'category-badge-premaligno';
    default: return 'category-badge-desconocido';
  }
};

const getLesionBadgeClass = (clase) => {
  const benignas = ['Benigno General', 'Nevo Lunar', 'Dermatofibroma', 'Queratosis Seborreica'];
  const malignas = ['Melanoma', 'Carcinoma Basocelular', 'Carcinoma Escamocelular'];
  
  if (benignas.includes(clase)) return 'lesion-badge-benigno';
  if (malignas.includes(clase)) return 'lesion-badge-maligno';
  if (clase === 'Premaligno') return 'lesion-badge-premaligno';
  return 'lesion-badge-desconocido';
};

const getConfidenceColor = (confidence) => {
  if (confidence >= 90) return '#28a745';
  if (confidence >= 70) return '#ffc107';
  return '#dc3545';
};

function Historial({ onViewChange }) {  // ← Recibir la función para cambiar de vista
  const [allDiagnosticos, setAllDiagnosticos] = useState([]);
  const [filteredDiagnosticos, setFilteredDiagnosticos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchType, setSearchType] = useState('id');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estado para el modal de autenticación
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingDiagnostico, setPendingDiagnostico] = useState(null);

  const getCie10Code = (diagnostico) => {
    return diagnostico.codigo_cie10 || cie10Mapping[diagnostico.clase] || 'R22.9';
  };

  const loadDiagnosticos = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/diagnosticos/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllDiagnosticos(data);
        setTotalCount(data.length);
        applyFilters(data);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error cargando diagnósticos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los diagnósticos',
        confirmButtonColor: '#d9534f'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = (diagnosticos) => {
    let filtered = [...diagnosticos];
    
    if (searchValue) {
      if (searchType === 'id') {
        const total = diagnosticos.length;
        filtered = diagnosticos.filter((_, idx) => {
          const displayId = total - idx;
          return displayId.toString() === searchValue;
        });
      } else {
        filtered = diagnosticos.filter(d => 
          d.paciente_identificacion && 
          d.paciente_identificacion.toString().includes(searchValue)
        );
      }
    }
    
    filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    const totalGlobal = diagnosticos.length;
    filtered.forEach(d => {
      const originalIndex = diagnosticos.findIndex(od => od.id === d.id);
      d.displayId = totalGlobal - originalIndex;
    });
    
    setFilteredDiagnosticos(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters(allDiagnosticos);
  }, [searchValue, searchType, allDiagnosticos]);

  useEffect(() => {
    loadDiagnosticos();
  }, [loadDiagnosticos]);

  // Función para manejar "Ver resultados" con autenticación
  const handleViewResults = (diagnostico) => {
    setPendingAction('view');
    setPendingDiagnostico(diagnostico);
    setAuthModalOpen(true);
  };

  // Función para manejar "Eliminar" con autenticación
  const handleDeleteClick = (diagnostico) => {
    setPendingAction('delete');
    setPendingDiagnostico(diagnostico);
    setAuthModalOpen(true);
  };

  // Función que se ejecuta DESPUÉS de verificar la contraseña
    const handleAuthSuccess = () => {
    if (pendingAction === 'view' && pendingDiagnostico) {
        // Mostrar resultados en el componente Resultados
        if (typeof window.showDiagnosticoInResults === 'function') {
        window.showDiagnosticoInResults(pendingDiagnostico);
        }
        // Cambiar a la vista de resultados
        if (onViewChange) {
        onViewChange('results');
        }
    } else if (pendingAction === 'delete' && pendingDiagnostico) {
        deleteRecord(pendingDiagnostico.id, pendingDiagnostico.displayId);
    }
    
    setPendingAction(null);
    setPendingDiagnostico(null);
    };

  const deleteRecord = async (id, displayId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará permanentemente este diagnóstico del historial.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d9534f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/api/diagnosticos/${id}/delete/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (response.ok) {
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El diagnóstico ha sido eliminado del historial.',
            icon: 'success',
            confirmButtonColor: '#2f7a7a',
            timer: 2000
          });
          loadDiagnosticos();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Error al eliminar');
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el diagnóstico: ' + error.message,
          icon: 'error',
          confirmButtonColor: '#d9534f'
        });
      }
    }
  };

  const paginatedData = filteredDiagnosticos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  const totalPages = Math.ceil(filteredDiagnosticos.length / pageSize);

  return (
    <>
      <section className="view" id="history">
        <div className="history-header">
          <div className="history-stats">
            <p className="total-label">Total de diagnósticos:</p>
            <p className="total-count" id="totalCount">{totalCount}</p>
          </div>
          <div className="search-filters">
            <div className="search-tabs">
              <button 
                className={`search-tab ${searchType === 'id' ? 'active' : ''}`}
                onClick={() => {
                  setSearchType('id');
                  setSearchValue('');
                }}
              >
                Buscar por ID
              </button>
              <button 
                className={`search-tab ${searchType === 'cedula' ? 'active' : ''}`}
                onClick={() => {
                  setSearchType('cedula');
                  setSearchValue('');
                }}
              >
                Buscar por Cédula
              </button>
            </div>
            <div className="search-input-group">
              <input 
                id="historySearchInput" 
                placeholder={searchType === 'id' ? "Ingrese ID del examen" : "Ingrese número de cédula"}
                type={searchType === 'id' ? "number" : "text"}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <button 
                id="historySearchBtn" 
                className="search-btn"
                onClick={() => applyFilters(allDiagnosticos)}
              >
                Buscar
              </button>
              <button 
                id="clearSearchBtn" 
                className="clear-btn"
                onClick={() => {
                  setSearchValue('');
                  applyFilters(allDiagnosticos);
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="filters-container">
            <span className="filter-label">Mostrar:</span>
            <select 
              id="resultsLimit" 
              className="filter-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="5">5 resultados</option>
              <option value="10" selected>10 resultados</option>
              <option value="25">25 resultados</option>
              <option value="50">50 resultados</option>
              <option value="100">100 resultados</option>
              <option value="0">Todos los resultados</option>
            </select>
          </div>
        </div>

        <h2>Historial de diagnósticos</h2>
        
        <div className="table-responsive">
          <table id="historyTable" className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Tipo de lesión</th>
                <th>Riesgo</th>
                <th>Código CIE-10</th>
                <th>Confianza IA(%)</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    Cargando diagnósticos...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#556' }}>
                    {searchValue ? 
                      `No se encontraron diagnósticos para la búsqueda "${searchValue}"` : 
                      'No hay diagnósticos en el historial.'}
                  </td>
                </tr>
              ) : (
                paginatedData.map(diagnostico => {
                  const fecha = new Date(diagnostico.fecha).toLocaleString('es-CO', {
                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                  });
                  const cie10Code = getCie10Code(diagnostico);
                  const risk = getRiskLevel(diagnostico.categoria);
                  const categoryBadgeClass = getCategoryBadgeClass(diagnostico.categoria);
                  const lesionBadgeClass = getLesionBadgeClass(diagnostico.clase);
                  
                  return (
                    <tr key={diagnostico.id}>
                      <td><strong>{diagnostico.displayId}</strong></td>
                      <td>{fecha}</td>
                      <td><span className={`badge ${categoryBadgeClass}`}>{diagnostico.categoria}</span></td>
                      <td><span className={`badge ${lesionBadgeClass}`}>{diagnostico.clase}</span></td>
                      <td><span className={`badge ${risk.class}`}>{risk.icon} {risk.text}</span></td>
                      <td><span className="cie-code">{cie10Code}</span></td>
                      <td>
                        <span className="confidence-value" style={{ fontWeight: 600, color: getConfidenceColor(diagnostico.confianza) }}>
                          {diagnostico.confianza}%
                        </span>
                       </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="actions-container" style={{ justifyContent: 'center' }}>
                          <button 
                            className="view-results-btn"
                            onClick={() => handleViewResults(diagnostico)}
                          >
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>Ver resultados</span>
                          </button>
                          <button 
                            className="delete-record-btn"
                            onClick={() => handleDeleteClick(diagnostico)}
                          >
                            <ion-icon name="trash-outline"></ion-icon>
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredDiagnosticos.length > 0 && (
          <div className="pagination-container" id="paginationContainer">
            <button 
              id="prevPageBtn" 
              className="pagination-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              ◀ Anterior
            </button>
            <span id="pageInfo" className="page-info">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              id="nextPageBtn" 
              className="pagination-btn" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Siguiente ▶
            </button>
          </div>
        )}
      </section>

      {/* Modal de autenticación */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingAction(null);
          setPendingDiagnostico(null);
        }}
        onVerify={(success) => {
          if (success) {
            handleAuthSuccess();
          }
          setAuthModalOpen(false);
        }}
        title="Verificar identidad"
        message="Para realizar esta acción, ingresa tu contraseña."
      />
    </>
  );
}

export default Historial;