// Funciones de comunicación con el backend
const API_EMPLEADOS = '/api/empleados';
const API_DEPARTAMENTOS = '/api/departamentos';
const API_NOMINAS = '/api/nominas';
const API_RECIBOS = '/api/recibos';

// Función para manejar respuestas no autorizadas o expiradas
async function handleResponse(response) {
    if (response.status === 401) {
        localStorage.removeItem('sessionActive');
        alert('⏰ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        window.location.href = '/';
        throw new Error('Sesión expirada');
    }
    return response;
}

/* ==========================================================================
   SESIÓN Y AUTENTICACIÓN
   ========================================================================== */
export async function verificarSesion() {
    try {
        const resp = await fetch('/api/check-session');
        if (!resp.ok) return { loggedIn: false };
        return await resp.json();
    } catch {
        return { loggedIn: false };
    }
}

export async function login(email, password) {
    const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.success) {
        throw new Error(data.message || 'Credenciales incorrectas');
    }
    return data;
}

export async function logout() {
    await fetch('/api/logout', { method: 'POST' });
}

/* ==========================================================================
   EMPLEADOS
   ========================================================================== */
export async function obtenerEmpleados() {
    const resp = await fetch(API_EMPLEADOS);
    await handleResponse(resp);
    if (!resp.ok) throw new Error('Error al obtener empleados');
    return await resp.json();
}

export async function crearEmpleado(formData) {
    const resp = await fetch(API_EMPLEADOS, {
        method: 'POST',
        body: formData
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.errores ? data.errores.join(', ') : data.error || 'Error al crear');
    }
    return await resp.json();
}

export async function actualizarEmpleado(cedula, formData) {
    const resp = await fetch(`${API_EMPLEADOS}/${cedula}`, {
        method: 'PUT',
        body: formData
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.errores?.join(', ') || 'Error al actualizar');
    }
    return await resp.json();
}

export async function eliminarEmpleado(cedula) {
    const resp = await fetch(`${API_EMPLEADOS}/${cedula}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    await handleResponse(resp);
    if (!resp.ok && resp.status !== 204) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar');
    }
    return true;
}

/* ==========================================================================
   DEPARTAMENTOS
   ========================================================================== */
export async function obtenerDepartamentos() {
    const resp = await fetch(API_DEPARTAMENTOS);
    await handleResponse(resp);
    if (!resp.ok) throw new Error('Error al obtener departamentos');
    return await resp.json();
}

export async function crearDepartamento(datos) {
    const resp = await fetch(API_DEPARTAMENTOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al crear departamento');
    }
    return await resp.json();
}

export async function actualizarDepartamento(id, datos) {
    const resp = await fetch(`${API_DEPARTAMENTOS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al actualizar departamento');
    }
    return await resp.json();
}

export async function eliminarDepartamento(id) {
    const resp = await fetch(`${API_DEPARTAMENTOS}/${id}`, {
        method: 'DELETE'
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al eliminar departamento');
    }
    return true;
}

/* ==========================================================================
   NÓMINAS
   ========================================================================== */
export async function obtenerNominas() {
    const resp = await fetch(API_NOMINAS);
    await handleResponse(resp);
    if (!resp.ok) throw new Error('Error al obtener nóminas');
    return await resp.json();
}

export async function obtenerNominaPorId(id) {
    const resp = await fetch(`${API_NOMINAS}/${id}`);
    await handleResponse(resp);
    if (!resp.ok) throw new Error('Error al obtener la nómina');
    return await resp.json();
}

export async function crearNomina(datos) {
    const resp = await fetch(API_NOMINAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al crear nómina');
    }
    return await resp.json();
}

export async function actualizarNomina(id, datos) {
    const resp = await fetch(`${API_NOMINAS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al actualizar nómina');
    }
    return await resp.json();
}

export async function generarRecibosNomina(id) {
    const resp = await fetch(`${API_NOMINAS}/${id}/generar`, {
        method: 'POST'
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al generar recibos');
    }
    return await resp.json();
}

export async function cambiarEstadoNomina(id, estado) {
    const resp = await fetch(`${API_NOMINAS}/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al cambiar estado');
    }
    return await resp.json();
}

export async function eliminarNomina(id) {
    const resp = await fetch(`${API_NOMINAS}/${id}`, {
        method: 'DELETE'
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al eliminar nómina');
    }
    return true;
}

/* ==========================================================================
   RECIBOS DE PAGO
   ========================================================================== */
export async function obtenerRecibos(nomina_id = null, cedula = null) {
    let url = API_RECIBOS;
    const params = new URLSearchParams();
    if (nomina_id) params.append('nomina_id', nomina_id);
    if (cedula) params.append('cedula', cedula);
    if (params.toString()) url += `?${params.toString()}`;

    const resp = await fetch(url);
    await handleResponse(resp);
    if (!resp.ok) throw new Error('Error al obtener recibos');
    return await resp.json();
}

export async function obtenerReciboPorId(id) {
    const resp = await fetch(`${API_RECIBOS}/${id}`);
    await handleResponse(resp);
    if (!resp.ok) throw new Error('Error al obtener recibo de pago');
    return await resp.json();
}

export async function actualizarRecibo(id, datos) {
    const resp = await fetch(`${API_RECIBOS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al actualizar recibo');
    }
    return await resp.json();
}

export async function eliminarRecibo(id) {
    const resp = await fetch(`${API_RECIBOS}/${id}`, {
        method: 'DELETE'
    });
    await handleResponse(resp);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al eliminar recibo');
    }
    return true;
}
