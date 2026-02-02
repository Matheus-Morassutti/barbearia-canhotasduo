const SUPABASE_URL = 'https://vgxwjlzxbdfoxnqjdxfl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_F8sl92FjolI59mFI83IK7g_f-cGxkIW';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- PROTEÇÃO DE ROTA ---
// Se estiver no admin, verifica se está logado como admin
async function verificarAcesso() {
    const { data: { user } } = await _supabase.auth.getUser();
    const noAdminPage = window.location.pathname.includes('admin.html');

    if (noAdminPage) {
        if (!user || user.email !== 'admin@barber.com') {
            window.location.href = 'index.html';
        } else {
            carregarAgenda();
        }
    }
}
verificarAcesso();

// --- NAVEGAÇÃO ---
function showSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(sec => sec.style.display = 'none');
    document.getElementById('sec-' + sectionId).style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// --- LOGIN (Apenas no index.html) ---
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Erro: " + error.message);
    } else {
        if (data.user.email === 'admin@barber.com') {
            window.location.href = 'admin.html';
        } else {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('area-cliente').style.display = 'block';
            document.getElementById('cliente_nome').value = data.user.user_metadata.full_name || "";
            document.getElementById('cliente_telefone').value = data.user.user_metadata.phone || "";
        }
    }
}

// --- AGENDA (ADMIN) ---
async function carregarAgenda() {
    const filtro = document.getElementById('filtro-data');
    const dataFiltro = filtro ? filtro.value : null;
    
    let query = _supabase.from('agendamentos').select('*');

    if (dataFiltro) {
        query = query.gte('data_hora', `${dataFiltro}T00:00:00`)
                     .lte('data_hora', `${dataFiltro}T23:59:59`);
    }

    const { data, error } = await query.order('data_hora', { ascending: true });
    const lista = document.getElementById('lista-agendamentos');

    if (!lista) return;

    if (error || !data || data.length === 0) {
        lista.innerHTML = "<p style='color:#a8a8a8; padding: 20px;'>Nenhum corte agendado para este dia.</p>";
        return;
    }

    lista.innerHTML = data.map(a => `
        <div class="card-agendamento">
            <div>
                <strong>${a.cliente_nome}</strong>
                <span>${a.servico}</span>
                <small>${new Date(a.data_hora).toLocaleString('pt-BR')}</small>
                <small>📱 ${a.cliente_telefone || 'Sem tel'}</small>
            </div>
            <button onclick="concluirAgendamento(${a.id})" class="btn-concluir">✓</button>
        </div>
    `).join('');
}

// --- OUTRAS FUNÇÕES ---
async function logout() {
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
}

function mostrarTelaRegistro() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('registro-container').style.display = 'block';
}

function voltarLogin() {
    document.getElementById('registro-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
}

async function registrarNovoUsuario() {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    const telefone = document.getElementById('reg-telefone').value;

    const { error } = await _supabase.auth.signUp({
        email, password: senha,
        options: { data: { full_name: nome, phone: telefone } }
    });

    if (error) alert(error.message);
    else { alert("Conta criada!"); voltarLogin(); }
}

async function agendar() {
    const nome = document.getElementById('cliente_nome').value;
    const telefone = document.getElementById('cliente_telefone').value;
    const servico = document.getElementById('servico').value;
    const data_hora = document.getElementById('data_hora').value;

    const { error } = await _supabase.from('agendamentos').insert([{ 
        cliente_nome: nome, cliente_telefone: telefone, servico, data_hora 
    }]);

    if (error) alert(error.message);
    else { alert("Agendado!"); location.reload(); }
}

async function concluirAgendamento(id) {
    if(confirm("Concluir corte?")) {
        await _supabase.from('agendamentos').delete().eq('id', id);
        carregarAgenda();
    }
}