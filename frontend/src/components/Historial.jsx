import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import AuthModal from './AuthModal';

// Importar CSS
import '../css/historial/total_diagnostics.css';
import '../css/historial/filtro_busqueda_id_cedula.css';
import '../css/historial/filtro_mostrar.css';
import '../css/historial/tabla.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

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

function Historial({ onViewChange }) {
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
  
  // Estado para saber si Resultados está listo
  const [resultadosReady, setResultadosReady] = useState(false);

  // Log de montaje/desmontaje
  useEffect(() => {
    errorCapture.logAction('Historial', 'MOUNT', 'Componente Historial montado');
    return () => {
      errorCapture.logAction('Historial', 'UNMOUNT', 'Componente Historial desmontado');
    };
  }, []);

  const getCie10Code = (diagnostico) => {
    return diagnostico.codigo_cie10 || cie10Mapping[diagnostico.clase] || 'R22.9';
  };

  const loadDiagnosticos = useCallback(async () => {
    errorCapture.logAction('Historial', 'LOAD_DIAGNOSTICOS_START', 'Cargando diagnósticos');
    const token = localStorage.getItem('token');
    if (!token) {
      errorCapture.logWarning('Historial', 'LOAD_DIAGNOSTICOS_NO_TOKEN', 'No hay token para cargar diagnósticos');
      return;
    }
    
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/diagnosticos/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setAllDiagnosticos(data);
        setTotalCount(data.length);
        applyFilters(data);
        
        errorCapture.logAction('Historial', 'LOAD_DIAGNOSTICOS_SUCCESS', 'Diagnósticos cargados exitosamente', {
          cantidad: data.length,
          duration_ms: duration
        });
      } else if (response.status === 401) {
        errorCapture.logWarning('Historial', 'SESSION_EXPIRED', 'Sesión expirada al cargar diagnósticos');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      errorCapture.logError('Historial', 'LOAD_DIAGNOSTICOS_ERROR', 'Error cargando diagnósticos', {
        error_message: error.message,
        duration_ms: duration
      });
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
    errorCapture.logAction('Historial', 'APPLY_FILTERS_START', 'Aplicando filtros', {
      searchValue: searchValue || 'ninguno',
      searchType: searchType
    });
    
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
      errorCapture.logAction('Historial', 'FILTERS_RESULT', 'Resultado de filtros', {
        original_count: diagnosticos.length,
        filtered_count: filtered.length,
        searchValue: searchValue,
        searchType: searchType
      });
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

  // Escuchar evento de que Resultados está listo
  useEffect(() => {
    errorCapture.logAction('Historial', 'SETUP_RESULTADOS_LISTENER', 'Configurando listener para resultadosReady');
    
    const handleResultadosReady = (event) => {
      errorCapture.logAction('Historial', 'RESULTADOS_READY_EVENT', 'Evento resultadosReady recibido', {
        timestamp: event.detail?.timestamp,
        disponible: !!event.detail?.showDiagnosticoInResults
      });
      setResultadosReady(true);
      if (event.detail?.showDiagnosticoInResults) {
        window.showDiagnosticoInResults = event.detail.showDiagnosticoInResults;
        errorCapture.logAction('Historial', 'FUNCTION_SAVED', 'Función showDiagnosticoInResults guardada desde evento');
      }
    };
    
    window.addEventListener('resultadosReady', handleResultadosReady);
    
    // También verificar si ya está disponible (por si el evento se perdió)
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      if (typeof window.showDiagnosticoInResults === 'function') {
        errorCapture.logAction('Historial', 'FUNCTION_AVAILABLE', 'showDiagnosticoInResults ya está disponible', {
          check_attempts: checkCount
        });
        setResultadosReady(true);
        clearInterval(checkInterval);
      } else if (checkCount <= 20) {
        // Solo log cada 5 intentos para no saturar
        if (checkCount % 5 === 0) {
          errorCapture.logAction('Historial', 'WAITING_FUNCTION', `Esperando función... intento ${checkCount}`);
        }
      }
    }, 500);
    
    return () => {
      errorCapture.logAction('Historial', 'CLEANUP_LISTENERS', 'Limpiando listeners');
      window.removeEventListener('resultadosReady', handleResultadosReady);
      clearInterval(checkInterval);
    };
  }, []);

  // Función para manejar "Ver resultados" con autenticación
  const handleViewResults = (diagnostico) => {
    errorCapture.logAction('Historial', 'VIEW_RESULTS_CLICK', 'Usuario solicitó ver resultados', {
      diagnostico_id: diagnostico.id,
      categoria: diagnostico.categoria,
      clase: diagnostico.clase,
      confianza: diagnostico.confianza
    });
    setPendingAction('view');
    setPendingDiagnostico(diagnostico);
    setAuthModalOpen(true);
  };

  // Función para manejar "Eliminar" con autenticación
  const handleDeleteClick = (diagnostico) => {
    errorCapture.logAction('Historial', 'DELETE_CLICK', 'Usuario solicitó eliminar diagnóstico', {
      diagnostico_id: diagnostico.id,
      categoria: diagnostico.categoria,
      clase: diagnostico.clase
    });
    setPendingAction('delete');
    setPendingDiagnostico(diagnostico);
    setAuthModalOpen(true);
  };

  // Función que se ejecuta DESPUÉS de verificar la contraseña
  const handleAuthSuccess = () => {
    errorCapture.logAction('Historial', 'AUTH_SUCCESS', 'Autenticación exitosa', {
      pendingAction: pendingAction,
      diagnostico_id: pendingDiagnostico?.id,
      resultadosReady: resultadosReady
    });
    
    if (pendingAction === 'view' && pendingDiagnostico) {
      // Asegurar formato correcto de la imagen
      const diagnosticoConImagen = {
        ...pendingDiagnostico,
        imagen: pendingDiagnostico.imagen?.startsWith('data:image') 
          ? pendingDiagnostico.imagen 
          : `data:image/jpeg;base64,${pendingDiagnostico.imagen}`
      };
      
      errorCapture.logAction('Historial', 'VIEW_RESULTS_AUTH', 'Mostrando resultados después de autenticación', {
        diagnostico_id: pendingDiagnostico.id,
        imagen_formateada: !!diagnosticoConImagen.imagen
      });
      
      // Función con reintentos más robusta
      let intentoActual = 0;
      const maxIntentos = 15;
      
      const mostrarResultados = () => {
        if (typeof window.showDiagnosticoInResults === 'function') {
          errorCapture.logAction('Historial', 'SHOW_RESULTS_SUCCESS', `Función encontrada en intento ${intentoActual + 1}`, {
            diagnostico_id: pendingDiagnostico.id
          });
          
          setTimeout(() => {
            window.showDiagnosticoInResults(diagnosticoConImagen);
            errorCapture.logAction('Historial', 'RESULTS_DISPLAYED', 'Resultados mostrados correctamente');
            
            if (onViewChange) {
              errorCapture.logAction('Historial', 'CHANGE_VIEW_TO_RESULTS', 'Cambiando vista a resultados');
              onViewChange('results');
            }
          }, 100);
          
        } else if (intentoActual < maxIntentos - 1) {
          const delay = Math.min(300 * (intentoActual + 1), 3000);
          errorCapture.logAction('Historial', 'RETRY_SHOW_RESULTS', `Función no disponible, reintentando en ${delay}ms`, {
            intento: intentoActual + 1,
            delay_ms: delay
          });
          intentoActual++;
          setTimeout(mostrarResultados, delay);
        } else {
          errorCapture.logError('Historial', 'SHOW_RESULTS_FAILED', 'No se pudo mostrar resultados después de múltiples intentos', {
            max_intentos: maxIntentos,
            diagnostico_id: pendingDiagnostico.id
          });
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los resultados. Por favor, ve a la pestaña "Resultados" manualmente.',
            confirmButtonColor: '#d9534f'
          });
        }
      };
      
      mostrarResultados();
      
    } else if (pendingAction === 'delete' && pendingDiagnostico) {
      errorCapture.logAction('Historial', 'DELETE_AUTH', 'Ejecutando eliminación después de autenticación', {
        diagnostico_id: pendingDiagnostico.id
      });
      deleteRecord(pendingDiagnostico.id, pendingDiagnostico.displayId);
    }
    
    setPendingAction(null);
    setPendingDiagnostico(null);
  };

  const deleteRecord = async (id, displayId) => {
    errorCapture.logAction('Historial', 'DELETE_START', 'Iniciando eliminación de diagnóstico', {
      diagnostico_id: id,
      display_id: displayId
    });
    
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
      errorCapture.logAction('Historial', 'DELETE_CONFIRMED', 'Usuario confirmó eliminación', {
        diagnostico_id: id
      });
      
      const token = localStorage.getItem('token');
      const startTime = Date.now();
      
      try {
        const response = await fetch(`/api/diagnosticos/${id}/delete/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` }
        });
        
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          errorCapture.logAction('Historial', 'DELETE_SUCCESS', 'Diagnóstico eliminado exitosamente', {
            diagnostico_id: id,
            duration_ms: duration
          });
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
          errorCapture.logError('Historial', 'DELETE_API_ERROR', 'Error en API de eliminación', {
            diagnostico_id: id,
            error: error.error,
            status: response.status,
            duration_ms: duration
          });
          throw new Error(error.error || 'Error al eliminar');
        }
      } catch (error) {
        errorCapture.logError('Historial', 'DELETE_ERROR', 'Error al eliminar diagnóstico', {
          diagnostico_id: id,
          error_message: error.message
        });
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el diagnóstico: ' + error.message,
          icon: 'error',
          confirmButtonColor: '#d9534f'
        });
      }
    } else {
      errorCapture.logAction('Historial', 'DELETE_CANCELLED', 'Usuario canceló eliminación', {
        diagnostico_id: id
      });
    }
  };

  const handleSearchTypeChange = (type) => {
    errorCapture.logAction('Historial', 'SEARCH_TYPE_CHANGE', `Cambiando tipo de búsqueda a: ${type}`);
    setSearchType(type);
    setSearchValue('');
  };

  const handleClearSearch = () => {
    errorCapture.logAction('Historial', 'CLEAR_SEARCH', 'Limpiando búsqueda');
    setSearchValue('');
    applyFilters(allDiagnosticos);
  };

  const handlePageSizeChange = (newSize) => {
    errorCapture.logAction('Historial', 'PAGE_SIZE_CHANGE', `Cambiando pageSize a: ${newSize}`);
    setPageSize(parseInt(newSize));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage, direction) => {
    errorCapture.logAction('Historial', 'PAGE_CHANGE', `Cambiando página ${direction}`, {
      from: currentPage,
      to: newPage
    });
    setCurrentPage(newPage);
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
                onClick={() => handleSearchTypeChange('id')}
              >
                Buscar por ID
              </button>
              <button 
                className={`search-tab ${searchType === 'cedula' ? 'active' : ''}`}
                onClick={() => handleSearchTypeChange('cedula')}
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
                onClick={handleClearSearch}
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
              onChange={(e) => handlePageSizeChange(e.target.value)}
            >
              <option value="5">5 resultados</option>
              <option value="10">10 resultados</option>
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
              onClick={() => handlePageChange(currentPage - 1, 'anterior')}
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
              onClick={() => handlePageChange(currentPage + 1, 'siguiente')}
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
          errorCapture.logAction('Historial', 'MODAL_CLOSE', 'Modal de autenticación cerrado sin éxito');
          setAuthModalOpen(false);
          setPendingAction(null);
          setPendingDiagnostico(null);
        }}
        onVerify={(success) => {
          errorCapture.logAction('Historial', 'MODAL_VERIFY_RESULT', 'Resultado de verificación', {
            success: success
          });
          if (success) {
            handleAuthSuccess();
          } else {
            errorCapture.logWarning('Historial', 'VERIFICATION_FAILED', 'Verificación de contraseña fallida');
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