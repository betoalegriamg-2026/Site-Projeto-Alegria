import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`);
      setUser(res.data);
    } catch (e) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("token", res.data.access_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await axios.post(`${API}/auth/register`, data);
    localStorage.setItem("token", res.data.access_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/painel" />;
  
  return children;
};

// Landing Page Components
const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-md" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">PA</span>
          </div>
          <span className="font-heading font-bold text-xl text-primary-dark">Projeto Alegria</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#sobre" className="nav-link" data-testid="nav-about">Sobre</a>
          <a href="#turmas" className="nav-link" data-testid="nav-classes">Turmas</a>
          <a href="#projetos" className="nav-link" data-testid="nav-projects">Projetos</a>
          <a href="#galeria" className="nav-link" data-testid="nav-gallery">Galeria</a>
          <a href="#contato" className="nav-link" data-testid="nav-contact">Contato</a>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/painel" className="btn-secondary" data-testid="dashboard-btn">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Painel
            </Link>
          ) : (
            <Link to="/login" className="btn-secondary" data-testid="admin-btn">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Entrar
            </Link>
          )}
          <Link to="/inscricao" className="btn-primary" data-testid="enroll-btn">
            Inscreva-se
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} data-testid="mobile-menu-btn">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg py-4 px-6">
          <a href="#sobre" className="block py-2" onClick={() => setMenuOpen(false)}>Sobre</a>
          <a href="#turmas" className="block py-2" onClick={() => setMenuOpen(false)}>Turmas</a>
          <a href="#projetos" className="block py-2" onClick={() => setMenuOpen(false)}>Projetos</a>
          <a href="#contato" className="block py-2" onClick={() => setMenuOpen(false)}>Contato</a>
        </div>
      )}
    </header>
  );
};

const HeroSection = () => {
  const [stats, setStats] = useState({ students: 64, classes: 8, years: 5 });

  useEffect(() => {
    axios.get(`${API}/public/stats`).then(res => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <section className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-blue-50 via-white to-yellow-50" data-testid="hero-section">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <span className="inline-block bg-secondary/20 text-secondary-dark px-4 py-2 rounded-full text-sm font-semibold">
            Transformando vidas desde 2021
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-dark leading-tight">
            Transformando Vidas através da <span className="text-primary">Arte</span> e <span className="text-secondary-dark">Cultura</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-lg">
            Oferecemos aulas de dança, teatro, música e artes para crianças e jovens em situacao de vulnerabilidade social.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/inscricao" className="btn-primary text-lg px-8 py-4" data-testid="hero-enroll-btn">
              Inscreva-se Agora
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <a href="#sobre" className="btn-outline text-lg px-8 py-4" data-testid="hero-about-btn">
              Conheca o Projeto
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="relative z-10">
            <img
              src="https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Criancas participando de atividades"
              className="rounded-3xl shadow-2xl w-full object-cover h-[500px]"
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-dark">{stats.students}+</p>
                <p className="text-gray-500">Alunos Atendidos</p>
              </div>
            </div>
          </div>
          <div className="absolute top-10 -right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl -z-10" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-20">
        <div className="grid grid-cols-3 gap-8 bg-white rounded-3xl shadow-lg p-8">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{stats.students}</p>
            <p className="text-gray-500 mt-1">Alunos Atendidos</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-4xl font-bold text-secondary-dark">{stats.years}</p>
            <p className="text-gray-500 mt-1">Anos de Historia</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-accent-green">{stats.classes}</p>
            <p className="text-gray-500 mt-1">Turmas Ativas</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutSection = () => {
  return (
    <section id="sobre" className="py-20 bg-white" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img
              src="https://images.pexels.com/photos/2883380/pexels-photo-2883380.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Comunidade do Projeto Alegria"
              className="rounded-3xl shadow-xl w-full object-cover h-[500px]"
            />
            <div className="absolute -bottom-6 -right-6 bg-primary text-white rounded-2xl p-6 shadow-xl">
              <p className="text-4xl font-bold">5</p>
              <p className="text-sm opacity-80">Anos</p>
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-primary font-semibold">Sobre Nos</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark">
              Levando arte, cultura e esperanca para comunidades
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O <strong>Projeto Alegria</strong> nasceu em 2021 com o proposito de transformar a vida de criancas e jovens em situacao de vulnerabilidade social atraves da arte e da cultura.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Acreditamos que a arte tem o poder de desenvolver habilidades, fortalecer a autoestima, promover a inclusao social e abrir portas para um futuro melhor.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              <div className="bg-blue-50 rounded-2xl p-6">
                <h4 className="font-bold text-primary-dark mb-2">Nossa Missao</h4>
                <p className="text-sm text-gray-600">
                  Promover o desenvolvimento integral de criancas e jovens atraves do acesso a atividades artisticas e culturais de qualidade.
                </p>
              </div>
              <div className="bg-yellow-50 rounded-2xl p-6">
                <h4 className="font-bold text-primary-dark mb-2">Nossa Visao</h4>
                <p className="text-sm text-gray-600">
                  Ser referencia em educacao artistica e cultural, contribuindo para a formacao de cidadaos criticos e criativos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-accent-green" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Taxa Social Acessivel
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-accent-green" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Professores Qualificados
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-accent-green" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Material Didatico Incluso
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ClassesSection = () => {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    axios.get(`${API}/public/classes`).then(res => setClasses(res.data)).catch(() => {});
  }, []);

  const classImages = {
    "Zumba": "https://images.pexels.com/photos/7337604/pexels-photo-7337604.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Pilates": "https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Natacao": "https://images.pexels.com/photos/6011945/pexels-photo-6011945.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Jiu-Jitsu": "https://images.pexels.com/photos/6765015/pexels-photo-6765015.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Ballet": "https://images.pexels.com/photos/358010/pexels-photo-358010.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Hidroginastica": "https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Funcional": "https://images.pexels.com/photos/4720268/pexels-photo-4720268.jpeg?auto=compress&cs=tinysrgb&w=600",
    "default": "https://images.pexels.com/photos/7026054/pexels-photo-7026054.jpeg?auto=compress&cs=tinysrgb&w=600"
  };

  const getClassImage = (name) => {
    for (const key of Object.keys(classImages)) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return classImages[key];
      }
    }
    return classImages.default;
  };

  return (
    <section id="turmas" className="py-20 bg-gray-50" data-testid="classes-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-primary font-semibold">Nossas Turmas</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mt-2">
            Conheca as modalidades oferecidas
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Escolha a atividade ideal para voce ou seu filho e venha fazer parte da nossa familia!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="class-card group" data-testid={`class-card-${cls.id}`}>
              <div className="relative h-48 overflow-hidden rounded-t-2xl">
                <img src={getClassImage(cls.name)} alt={cls.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-4 left-4 text-white font-semibold text-lg">{cls.name}</span>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 line-clamp-2">{cls.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <p>{cls.days_of_week?.join(", ")}</p>
                    <p>{cls.start_time} - {cls.end_time}</p>
                  </div>
                  <span className="text-primary font-bold">R$ {cls.monthly_fee?.toFixed(2)}</span>
                </div>
                {cls.age_group && (
                  <span className="inline-block mt-3 text-xs bg-blue-100 text-primary px-3 py-1 rounded-full">
                    {cls.age_group}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/inscricao" className="btn-primary" data-testid="classes-enroll-btn">
            Ver Todas as Turmas
          </Link>
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    axios.get(`${API}/public/testimonials`).then(res => setTestimonials(res.data)).catch(() => {
      setTestimonials([
        { id: "1", name: "Maria Silva", role: "Mae de aluno", content: "O Projeto Alegria transformou a vida do meu filho. Ele agora e mais confiante e adora as aulas!" },
        { id: "2", name: "Joao Santos", role: "Aluno de Jiu-Jitsu", content: "Aprendi muito mais do que tecnicas de luta. Aprendi disciplina, respeito e trabalho em equipe." },
        { id: "3", name: "Ana Costa", role: "Voluntaria", content: "E emocionante ver a alegria das criancas durante as atividades. O projeto faz a diferenca!" }
      ]);
    });
  }, []);

  return (
    <section className="py-20 bg-primary" data-testid="testimonials-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-secondary font-semibold">Depoimentos</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mt-2">
            O que dizem sobre o Projeto Alegria
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-8 shadow-lg" data-testid={`testimonial-${t.id}`}>
              <svg className="w-10 h-10 text-secondary mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              <p className="text-gray-600 mb-6">{t.content}</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">{t.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-primary-dark">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API}/public/contact`, form);
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      alert("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contato" className="py-20 bg-gray-50" data-testid="contact-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-primary font-semibold">Entre em Contato</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mt-2">
            Estamos aqui para ajudar!
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-primary-dark">Endereco</h4>
                <p className="text-gray-600">Rua da Alegria, 123 - Centro</p>
                <p className="text-gray-600">Sao Paulo - SP, 01234-567</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-primary-dark">Telefone</h4>
                <p className="text-gray-600">(11) 98765-4321</p>
                <p className="text-gray-600">(11) 3456-7890</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-primary-dark">Email</h4>
                <p className="text-gray-600">contato@projetoalegria.org</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-primary-dark">Horario de Atendimento</h4>
                <p className="text-gray-600">Segunda a Sexta: 8h as 18h</p>
                <p className="text-gray-600">Sabado: 9h as 13h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-primary-dark mb-2">Mensagem Enviada!</h3>
                <p className="text-gray-600">Entraremos em contato em breve.</p>
                <button onClick={() => setSent(false)} className="btn-primary mt-6">Enviar outra mensagem</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                  <input type="text" required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" required className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input type="tel" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="contact-phone" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
                  <select required className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="contact-subject">
                    <option value="">Selecione...</option>
                    <option value="Informacoes Gerais">Informacoes Gerais</option>
                    <option value="Inscricao">Inscricao</option>
                    <option value="Voluntariado">Voluntariado</option>
                    <option value="Doacoes">Doacoes</option>
                    <option value="Parcerias">Parcerias</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
                  <textarea rows={4} required className="input-field resize-none" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message" />
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full" data-testid="contact-submit">
                  {sending ? "Enviando..." : "Enviar Mensagem"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-primary text-white py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">PA</span>
              </div>
              <span className="font-heading font-bold text-xl">Projeto Alegria</span>
            </div>
            <p className="text-white/70 text-sm">
              Transformando vidas atraves da arte e cultura desde 2021.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Links Rapidos</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="#sobre" className="hover:text-white transition">Sobre</a></li>
              <li><a href="#turmas" className="hover:text-white transition">Turmas</a></li>
              <li><a href="#contato" className="hover:text-white transition">Contato</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Modalidades</h4>
            <ul className="space-y-2 text-white/70">
              <li>Zumba</li>
              <li>Pilates</li>
              <li>Natacao</li>
              <li>Jiu-Jitsu</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Contato</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>contato@projetoalegria.org</li>
              <li>(11) 98765-4321</li>
              <li>Rua da Alegria, 123</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60 text-sm">
          <p>&copy; 2024 Projeto Alegria. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

// Landing Page
const LandingPage = () => {
  return (
    <div>
      <Header />
      <HeroSection />
      <AboutSection />
      <ClassesSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/painel");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/painel");
    } catch (err) {
      setError("Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-yellow-50 flex items-center justify-center p-6" data-testid="login-page">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">PA</span>
          </div>
        </Link>
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="font-heading text-2xl font-bold text-center text-primary-dark mb-6">Entrar no Sistema</h1>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input type="password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full" data-testid="login-submit">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Admin padrao: admin@projetoalegria.org / admin123
          </p>
        </div>
        <p className="text-center mt-6">
          <Link to="/" className="text-primary hover:underline">Voltar ao site</Link>
        </p>
      </div>
    </div>
  );
};

// Enrollment Page
const EnrollmentPage = () => {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    name: "", birth_date: "", cpf: "", mother_name: "", father_name: "",
    phone: "", whatsapp: "", email: "", address: "", city: "", state: "",
    medical_conditions: "", class_id: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/public/classes`).then(res => setClasses(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Submit as contact message for now (public endpoint)
      await axios.post(`${API}/public/contact`, {
        name: form.name,
        email: form.email || "nao_informado@email.com",
        phone: form.phone,
        subject: "Nova Inscricao",
        message: `
          Nome: ${form.name}
          Data Nasc: ${form.birth_date}
          CPF: ${form.cpf}
          Mae: ${form.mother_name}
          Pai: ${form.father_name}
          Telefone: ${form.phone}
          WhatsApp: ${form.whatsapp}
          Email: ${form.email}
          Endereco: ${form.address}, ${form.city} - ${form.state}
          Condicoes Medicas: ${form.medical_conditions}
          Turma: ${classes.find(c => c.id === form.class_id)?.name || "Nao selecionada"}
        `
      });
      setSubmitted(true);
    } catch (err) {
      alert("Erro ao enviar inscricao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-yellow-50 py-12" data-testid="enrollment-page">
      <div className="max-w-2xl mx-auto px-6">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">PA</span>
          </div>
          <span className="font-heading font-bold text-2xl text-primary-dark">Projeto Alegria</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="font-heading text-2xl font-bold text-center text-primary-dark mb-2">Formulario de Inscricao</h1>
          <p className="text-center text-gray-600 mb-8">Preencha os dados para realizar sua inscricao</p>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-2">Inscricao Enviada!</h3>
              <p className="text-gray-600 mb-6">Entraremos em contato para confirmar sua matricula.</p>
              <Link to="/" className="btn-primary">Voltar ao Site</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo do Aluno *</label>
                <input type="text" required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="enroll-name" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                  <input type="date" className="input-field" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} data-testid="enroll-birth" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <input type="text" className="input-field" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} data-testid="enroll-cpf" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Mae</label>
                  <input type="text" className="input-field" value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} data-testid="enroll-mother" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Pai</label>
                  <input type="text" className="input-field" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} data-testid="enroll-father" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                  <input type="tel" required className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="enroll-phone" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                  <input type="tel" className="input-field" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} data-testid="enroll-whatsapp" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="enroll-email" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereco</label>
                <input type="text" className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="enroll-address" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input type="text" className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="enroll-city" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <input type="text" className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} data-testid="enroll-state" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condicoes Medicas / Observacoes</label>
                <textarea rows={3} className="input-field resize-none" value={form.medical_conditions} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} data-testid="enroll-medical" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turma de Interesse *</label>
                <select required className="input-field" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} data-testid="enroll-class">
                  <option value="">Selecione uma turma...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.days_of_week?.join(", ")} {c.start_time}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full" data-testid="enroll-submit">
                {loading ? "Enviando..." : "Enviar Inscricao"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-primary hover:underline">Voltar ao site</Link>
        </p>
      </div>
    </div>
  );
};

// Dashboard Layout
const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/painel", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard" },
    { path: "/painel/alunos", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", label: "Alunos" },
    { path: "/painel/turmas", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", label: "Turmas" },
    { path: "/painel/presenca", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", label: "Presenca" },
    { path: "/painel/pagamentos", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", label: "Pagamentos" },
    { path: "/painel/caixa", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Fluxo de Caixa" },
    { path: "/painel/relatorios", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Relatorios" },
    { path: "/painel/site", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", label: "Editar Site", section: "cms" },
    { path: "/painel/galeria", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Galeria", section: "cms" },
    { path: "/painel/projetos", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", label: "Projetos", section: "cms" },
    { path: "/painel/depoimentos", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Depoimentos", section: "cms" },
    { path: "/painel/mensagens", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "Mensagens", section: "cms" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <span className="text-white font-bold">PA</span>
              </div>
              <span className="font-heading font-bold text-primary-dark">Alegria</span>
            </Link>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} /></svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.filter(i => !i.section).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${window.location.pathname === item.path ? "bg-primary text-white" : "hover:bg-gray-100 text-gray-700"}`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
          
          {sidebarOpen && <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase">Gerenciar Site</div>}
          {!sidebarOpen && <div className="border-t border-gray-200 my-2"></div>}
          
          {menuItems.filter(i => i.section === "cms").map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${window.location.pathname === item.path ? "bg-secondary text-secondary-dark" : "hover:bg-gray-100 text-gray-700"}`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-50 text-red-600 transition-colors" data-testid="logout-btn">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-primary-dark">Painel Administrativo</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Ola, {user?.name}</span>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold">{user?.name?.charAt(0)}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Dashboard Home
const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard/stats`).then(res => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  return (
    <div className="space-y-6" data-testid="dashboard-home">
      <h2 className="font-heading text-2xl font-bold text-primary-dark">Visao Geral</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total de Alunos</p>
              <p className="text-3xl font-bold text-primary-dark">{stats?.total_students || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
          <p className="text-sm text-accent-green mt-2">{stats?.active_students || 0} ativos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Turmas Ativas</p>
              <p className="text-3xl font-bold text-primary-dark">{stats?.total_classes || 0}</p>
            </div>
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{stats?.active_enrollments || 0} matriculas</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Receita do Mes</p>
              <p className="text-3xl font-bold text-accent-green">R$ {(stats?.monthly_income || 0).toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-sm text-red-500 mt-2">R$ {(stats?.pending_payments || 0).toFixed(2)} pendente</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Taxa de Presenca</p>
              <p className="text-3xl font-bold text-primary-dark">{stats?.attendance_rate || 0}%</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Este mes</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-primary-dark mb-4">Acoes Rapidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/painel/alunos" className="p-4 border rounded-xl hover:bg-gray-50 transition text-center">
              <svg className="w-8 h-8 text-primary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              <span className="text-sm font-medium">Novo Aluno</span>
            </Link>
            <Link to="/painel/presenca" className="p-4 border rounded-xl hover:bg-gray-50 transition text-center">
              <svg className="w-8 h-8 text-secondary-dark mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              <span className="text-sm font-medium">Registrar Presenca</span>
            </Link>
            <Link to="/painel/pagamentos" className="p-4 border rounded-xl hover:bg-gray-50 transition text-center">
              <svg className="w-8 h-8 text-accent-green mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="text-sm font-medium">Novo Pagamento</span>
            </Link>
            <Link to="/painel/relatorios" className="p-4 border rounded-xl hover:bg-gray-50 transition text-center">
              <svg className="w-8 h-8 text-accent-pink mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="text-sm font-medium">Ver Relatorios</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-primary-dark mb-4">Resumo Financeiro</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <span className="text-gray-700">Receitas do Mes</span>
              <span className="font-bold text-accent-green">R$ {(stats?.monthly_income || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <span className="text-gray-700">Despesas do Mes</span>
              <span className="font-bold text-red-600">R$ {(stats?.monthly_expenses || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <span className="text-gray-700">Saldo</span>
              <span className={`font-bold ${(stats?.monthly_income - stats?.monthly_expenses) >= 0 ? "text-accent-green" : "text-red-600"}`}>
                R$ {((stats?.monthly_income || 0) - (stats?.monthly_expenses || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder pages for other dashboard sections
const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", email: "", birth_date: "", cpf: "", mother_name: "", address: "", city: "", state: "", status: "active" });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/students`);
      setStudents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await axios.put(`${API}/students/${editingStudent.id}`, form);
      } else {
        await axios.post(`${API}/students`, form);
      }
      fetchStudents();
      setShowModal(false);
      setEditingStudent(null);
      setForm({ name: "", phone: "", whatsapp: "", email: "", birth_date: "", cpf: "", mother_name: "", address: "", city: "", state: "", status: "active" });
    } catch (e) {
      alert("Erro ao salvar aluno");
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setForm(student);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir este aluno?")) {
      try {
        await axios.delete(`${API}/students/${id}`);
        fetchStudents();
      } catch (e) {
        alert("Erro ao excluir aluno");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  return (
    <div className="space-y-6" data-testid="students-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-primary-dark">Alunos</h2>
        <button onClick={() => { setEditingStudent(null); setForm({ name: "", phone: "", whatsapp: "", email: "", birth_date: "", cpf: "", mother_name: "", address: "", city: "", state: "", status: "active" }); setShowModal(true); }} className="btn-primary" data-testid="add-student-btn">
          + Novo Aluno
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Nome</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Telefone</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Email</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(student => (
              <tr key={student.id} className="hover:bg-gray-50" data-testid={`student-row-${student.id}`}>
                <td className="px-6 py-4">{student.name}</td>
                <td className="px-6 py-4 text-gray-600">{student.phone || student.whatsapp || "-"}</td>
                <td className="px-6 py-4 text-gray-600">{student.email || "-"}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${student.status === "active" ? "bg-green-100 text-green-700" : student.status === "suspended" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                    {student.status === "active" ? "Ativo" : student.status === "suspended" ? "Suspenso" : "Inativo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(student)} className="text-primary hover:underline mr-4" data-testid={`edit-student-${student.id}`}>Editar</button>
                  <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:underline" data-testid={`delete-student-${student.id}`}>Excluir</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Nenhum aluno cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="font-heading text-xl font-bold">{editingStudent ? "Editar Aluno" : "Novo Aluno"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input type="text" required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <input type="tel" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">WhatsApp</label>
                  <input type="tel" className="input-field" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data de Nascimento</label>
                  <input type="date" className="input-field" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CPF</label>
                  <input type="text" className="input-field" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nome da Mae</label>
                <input type="text" className="input-field" value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Endereco</label>
                <input type="text" className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cidade</label>
                  <input type="text" className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <input type="text" className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Ativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/classes`).then(res => {
      setClasses(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  return (
    <div className="space-y-6" data-testid="classes-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-primary-dark">Turmas</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg text-primary-dark mb-2">{cls.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{cls.description}</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p><strong>Instrutor:</strong> {cls.instructor || "Nao definido"}</p>
              <p><strong>Horario:</strong> {cls.days_of_week?.join(", ")} {cls.start_time} - {cls.end_time}</p>
              <p><strong>Faixa Etaria:</strong> {cls.age_group || "Todas as idades"}</p>
              <p><strong>Valor:</strong> R$ {cls.monthly_fee?.toFixed(2)}</p>
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500">{cls.enrolled_count} alunos matriculados</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                {cls.status === "active" ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AttendancePage = () => (
  <div className="space-y-6" data-testid="attendance-page">
    <h2 className="font-heading text-2xl font-bold text-primary-dark">Controle de Presenca</h2>
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      <p className="text-gray-600">Selecione uma turma para registrar presenca</p>
    </div>
  </div>
);

const PaymentsPage = () => (
  <div className="space-y-6" data-testid="payments-page">
    <h2 className="font-heading text-2xl font-bold text-primary-dark">Pagamentos</h2>
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      <p className="text-gray-600">Gestao de pagamentos dos alunos</p>
    </div>
  </div>
);

const CashFlowPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: "income", category: "", description: "", amount: "", due_date: "", payment_date: "", status: "pending", notes: "" });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API}/cashflow`);
      setEntries(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/cashflow`, { ...form, amount: parseFloat(form.amount) });
      fetchEntries();
      setShowModal(false);
      setForm({ type: "income", category: "", description: "", amount: "", due_date: "", payment_date: "", status: "pending", notes: "" });
    } catch (e) {
      alert("Erro ao salvar lancamento");
    }
  };

  const totals = entries.reduce((acc, e) => {
    if (e.type === "income") acc.income += e.amount;
    else acc.expense += e.amount;
    return acc;
  }, { income: 0, expense: 0 });

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  return (
    <div className="space-y-6" data-testid="cashflow-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-primary-dark">Fluxo de Caixa</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary" data-testid="add-entry-btn">+ Novo Lancamento</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">Total Receitas</p>
          <p className="text-2xl font-bold text-accent-green">R$ {totals.income.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">Total Despesas</p>
          <p className="text-2xl font-bold text-red-600">R$ {totals.expense.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">Saldo</p>
          <p className={`text-2xl font-bold ${totals.income - totals.expense >= 0 ? "text-accent-green" : "text-red-600"}`}>
            R$ {(totals.income - totals.expense).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Tipo</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Categoria</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Descricao</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Vencimento</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Valor</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${entry.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {entry.type === "income" ? "Receita" : "Despesa"}
                  </span>
                </td>
                <td className="px-6 py-4">{entry.category}</td>
                <td className="px-6 py-4">{entry.description}</td>
                <td className="px-6 py-4 text-gray-600">{entry.due_date}</td>
                <td className={`px-6 py-4 text-right font-semibold ${entry.type === "income" ? "text-accent-green" : "text-red-600"}`}>
                  R$ {entry.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${entry.status === "paid" ? "bg-green-100 text-green-700" : entry.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                    {entry.status === "paid" ? "Pago" : entry.status === "pending" ? "Pendente" : "Cancelado"}
                  </span>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Nenhum lancamento cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="font-heading text-xl font-bold">Novo Lancamento</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo *</label>
                <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoria *</label>
                <input type="text" required className="input-field" placeholder="Ex: Mensalidade, Aluguel, Material" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descricao *</label>
                <input type="text" required className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valor *</label>
                  <input type="number" step="0.01" required className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Vencimento *</label>
                  <input type="date" required className="input-field" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data Pagamento</label>
                  <input type="date" className="input-field" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Observacoes</label>
                <textarea rows={2} className="input-field resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/classes`).then(res => setClasses(res.data)).catch(() => {});
  }, []);

  const loadReport = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/reports/class/${selectedClass}`);
      setReport(res.data);
    } catch (e) {
      alert("Erro ao carregar relatorio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <h2 className="font-heading text-2xl font-bold text-primary-dark">Relatorios por Turma</h2>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Selecione a Turma</label>
            <select className="input-field" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} data-testid="report-class-select">
              <option value="">Selecione...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button onClick={loadReport} disabled={!selectedClass || loading} className="btn-primary" data-testid="load-report-btn">
            {loading ? "Carregando..." : "Gerar Relatorio"}
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-bold text-lg">{report.class.name}</h3>
            <p className="text-gray-600">{report.enrolled_count} alunos matriculados</p>
          </div>
          <table className="w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Aluno</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Presencas</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Faltas</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Taxa</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Pago</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Pendente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.students.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{s.student.name}</td>
                  <td className="px-6 py-4 text-center text-accent-green">{s.attendance.present}</td>
                  <td className="px-6 py-4 text-center text-red-600">{s.attendance.absent}</td>
                  <td className="px-6 py-4 text-center">{s.attendance.rate}%</td>
                  <td className="px-6 py-4 text-right text-accent-green">R$ {s.payments.total_paid.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-red-600">R$ {s.payments.pending_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ==================== CMS PAGES ====================

// Site Settings Page
const SiteSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  useEffect(() => {
    axios.get(`${API}/settings`).then(res => {
      setSettings(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/settings`, settings);
      setSettings(res.data);
      alert("Configuracoes salvas com sucesso!");
    } catch (e) {
      alert("Erro ao salvar configuracoes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  const tabs = [
    { id: "hero", label: "Hero/Banner" },
    { id: "about", label: "Sobre" },
    { id: "contact", label: "Contato" },
    { id: "social", label: "Redes Sociais" },
  ];

  return (
    <div className="space-y-6" data-testid="site-settings-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-primary-dark">Editar Site</h2>
        <button onClick={handleSave} disabled={saving} className="btn-primary" data-testid="save-settings-btn">
          {saving ? "Salvando..." : "Salvar Alteracoes"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-medium transition-colors ${activeTab === tab.id ? "bg-primary text-white" : "hover:bg-gray-50"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "hero" && settings && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Titulo Principal</label>
                <input type="text" className="input-field" value={settings.hero_title || ""} onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subtitulo</label>
                <textarea rows={3} className="input-field resize-none" value={settings.hero_subtitle || ""} onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Badge/Destaque</label>
                <input type="text" className="input-field" value={settings.hero_badge || ""} onChange={(e) => setSettings({ ...settings, hero_badge: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL da Imagem do Hero</label>
                <input type="url" className="input-field" placeholder="https://..." value={settings.hero_image || ""} onChange={(e) => setSettings({ ...settings, hero_image: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Anos de Atividade</label>
                <input type="number" className="input-field w-32" value={settings.years_active || 5} onChange={(e) => setSettings({ ...settings, years_active: parseInt(e.target.value) || 5 })} />
              </div>
            </div>
          )}

          {activeTab === "about" && settings && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Titulo da Secao Sobre</label>
                <input type="text" className="input-field" value={settings.about_title || ""} onChange={(e) => setSettings({ ...settings, about_title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descricao Principal</label>
                <textarea rows={4} className="input-field resize-none" value={settings.about_description || ""} onChange={(e) => setSettings({ ...settings, about_description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descricao Secundaria</label>
                <textarea rows={4} className="input-field resize-none" value={settings.about_description_2 || ""} onChange={(e) => setSettings({ ...settings, about_description_2: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL da Imagem Sobre</label>
                <input type="url" className="input-field" placeholder="https://..." value={settings.about_image || ""} onChange={(e) => setSettings({ ...settings, about_image: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Missao</label>
                  <textarea rows={3} className="input-field resize-none" value={settings.mission || ""} onChange={(e) => setSettings({ ...settings, mission: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Visao</label>
                  <textarea rows={3} className="input-field resize-none" value={settings.vision || ""} onChange={(e) => setSettings({ ...settings, vision: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "contact" && settings && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Endereco</label>
                  <input type="text" className="input-field" value={settings.address || ""} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cidade/Estado</label>
                  <input type="text" className="input-field" value={settings.city || ""} onChange={(e) => setSettings({ ...settings, city: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">CEP</label>
                  <input type="text" className="input-field" value={settings.zipcode || ""} onChange={(e) => setSettings({ ...settings, zipcode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" className="input-field" value={settings.email || ""} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone Principal</label>
                  <input type="tel" className="input-field" value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone Secundario</label>
                  <input type="tel" className="input-field" value={settings.phone_2 || ""} onChange={(e) => setSettings({ ...settings, phone_2: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">WhatsApp</label>
                  <input type="tel" className="input-field" value={settings.whatsapp || ""} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Horario (Dias Uteis)</label>
                  <input type="text" className="input-field" value={settings.hours_weekday || ""} onChange={(e) => setSettings({ ...settings, hours_weekday: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Horario (Fim de Semana)</label>
                  <input type="text" className="input-field" value={settings.hours_weekend || ""} onChange={(e) => setSettings({ ...settings, hours_weekend: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "social" && settings && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Facebook</label>
                  <input type="url" className="input-field" placeholder="https://facebook.com/..." value={settings.facebook || ""} onChange={(e) => setSettings({ ...settings, facebook: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Instagram</label>
                  <input type="url" className="input-field" placeholder="https://instagram.com/..." value={settings.instagram || ""} onChange={(e) => setSettings({ ...settings, instagram: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">YouTube</label>
                  <input type="url" className="input-field" placeholder="https://youtube.com/..." value={settings.youtube || ""} onChange={(e) => setSettings({ ...settings, youtube: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Twitter/X</label>
                  <input type="url" className="input-field" placeholder="https://twitter.com/..." value={settings.twitter || ""} onChange={(e) => setSettings({ ...settings, twitter: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Texto do Rodape</label>
                <textarea rows={2} className="input-field resize-none" value={settings.footer_text || ""} onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Gallery Page
const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ url: "", caption: "", category: "", order: 0 });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await axios.get(`${API}/gallery`);
      setImages(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/gallery`, form);
      fetchImages();
      setShowModal(false);
      setForm({ url: "", caption: "", category: "", order: 0 });
    } catch (e) {
      alert("Erro ao adicionar imagem");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir esta imagem?")) {
      try {
        await axios.delete(`${API}/gallery/${id}`);
        fetchImages();
      } catch (e) {
        alert("Erro ao excluir imagem");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  return (
    <div className="space-y-6" data-testid="gallery-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-primary-dark">Galeria de Fotos</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary" data-testid="add-image-btn">+ Nova Imagem</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {images.map(img => (
          <div key={img.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group">
            <div className="relative h-48">
              <img src={img.url} alt={img.caption || "Galeria"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => handleDelete(img.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 truncate">{img.caption || "Sem legenda"}</p>
              {img.category && <span className="text-xs bg-blue-100 text-primary px-2 py-1 rounded-full">{img.category}</span>}
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-4 text-center py-12 text-gray-500">Nenhuma imagem na galeria</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="font-heading text-xl font-bold">Nova Imagem</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">URL da Imagem *</label>
                <input type="url" required className="input-field" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Legenda</label>
                <input type="text" className="input-field" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <input type="text" className="input-field" placeholder="Ex: Eventos, Turmas, Apresentacoes" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ordem</label>
                <input type="number" className="input-field w-24" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Projects Page
const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", date: "", status: "active" });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await axios.put(`${API}/projects/${editingProject.id}`, form);
      } else {
        await axios.post(`${API}/projects`, form);
      }
      fetchProjects();
      setShowModal(false);
      setEditingProject(null);
      setForm({ title: "", description: "", image_url: "", date: "", status: "active" });
    } catch (e) {
      alert("Erro ao salvar projeto");
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setForm(project);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir este projeto?")) {
      try {
        await axios.delete(`${API}/projects/${id}`);
        fetchProjects();
      } catch (e) {
        alert("Erro ao excluir projeto");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  return (
    <div className="space-y-6" data-testid="projects-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-primary-dark">Projetos</h2>
        <button onClick={() => { setEditingProject(null); setForm({ title: "", description: "", image_url: "", date: "", status: "active" }); setShowModal(true); }} className="btn-primary" data-testid="add-project-btn">+ Novo Projeto</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {project.image_url && (
              <img src={project.image_url} alt={project.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-primary-dark">{project.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                  {project.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
              {project.date && <p className="text-xs text-gray-400 mb-4">{project.date}</p>}
              <div className="flex gap-2">
                <button onClick={() => handleEdit(project)} className="text-primary hover:underline text-sm">Editar</button>
                <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">Nenhum projeto cadastrado</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="font-heading text-xl font-bold">{editingProject ? "Editar Projeto" : "Novo Projeto"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Titulo *</label>
                <input type="text" required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descricao *</label>
                <textarea rows={3} required className="input-field resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL da Imagem</label>
                <input type="url" className="input-field" placeholder="https://..." value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data</label>
                  <input type="text" className="input-field" placeholder="Ex: Dezembro 2023" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Testimonials Page
const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [form, setForm] = useState({ name: "", role: "", content: "", avatar_url: "", status: "active" });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await axios.get(`${API}/testimonials`);
      setTestimonials(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTestimonial) {
        await axios.put(`${API}/testimonials/${editingTestimonial.id}`, form);
      } else {
        await axios.post(`${API}/testimonials`, form);
      }
      fetchTestimonials();
      setShowModal(false);
      setEditingTestimonial(null);
      setForm({ name: "", role: "", content: "", avatar_url: "", status: "active" });
    } catch (e) {
      alert("Erro ao salvar depoimento");
    }
  };

  const handleEdit = (t) => {
    setEditingTestimonial(t);
    setForm(t);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir este depoimento?")) {
      try {
        await axios.delete(`${API}/testimonials/${id}`);
        fetchTestimonials();
      } catch (e) {
        alert("Erro ao excluir depoimento");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  return (
    <div className="space-y-6" data-testid="testimonials-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-primary-dark">Depoimentos</h2>
        <button onClick={() => { setEditingTestimonial(null); setForm({ name: "", role: "", content: "", avatar_url: "", status: "active" }); setShowModal(true); }} className="btn-primary" data-testid="add-testimonial-btn">+ Novo Depoimento</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map(t => (
          <div key={t.id} className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">{t.name.charAt(0)}</span>
              </div>
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">"{t.content}"</p>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs ${t.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                {t.status === "active" ? "Ativo" : "Inativo"}
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(t)} className="text-primary hover:underline text-sm">Editar</button>
                <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
              </div>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">Nenhum depoimento cadastrado</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="font-heading text-xl font-bold">{editingTestimonial ? "Editar Depoimento" : "Novo Depoimento"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input type="text" required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Funcao/Papel *</label>
                <input type="text" required className="input-field" placeholder="Ex: Mae de aluno, Voluntario" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Depoimento *</label>
                <textarea rows={4} required className="input-field resize-none" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Messages Page
const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/messages`);
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/messages/${id}/status?status=${status}`);
      fetchMessages();
    } catch (e) {
      alert("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir esta mensagem?")) {
      try {
        await axios.delete(`${API}/messages/${id}`);
        fetchMessages();
        setSelectedMessage(null);
      } catch (e) {
        alert("Erro ao excluir mensagem");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  return (
    <div className="space-y-6" data-testid="messages-page">
      <h2 className="font-heading text-2xl font-bold text-primary-dark">Mensagens de Contato</h2>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <p className="font-medium">{messages.length} mensagens</p>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {messages.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedMessage(m)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition ${selectedMessage?.id === m.id ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium truncate">{m.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${m.status === "new" ? "bg-blue-100 text-blue-700" : m.status === "read" ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"}`}>
                    {m.status === "new" ? "Nova" : m.status === "read" ? "Lida" : "Respondida"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{m.subject}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="p-8 text-center text-gray-500">Nenhuma mensagem</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm">
          {selectedMessage ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg">{selectedMessage.subject}</h3>
                  <p className="text-gray-600">{selectedMessage.name} - {selectedMessage.email}</p>
                  {selectedMessage.phone && <p className="text-gray-500 text-sm">{selectedMessage.phone}</p>}
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedMessage.status}
                    onChange={(e) => updateStatus(selectedMessage.id, e.target.value)}
                    className="input-field text-sm py-2"
                  >
                    <option value="new">Nova</option>
                    <option value="read">Lida</option>
                    <option value="replied">Respondida</option>
                  </select>
                  <button onClick={() => handleDelete(selectedMessage.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <p className="text-xs text-gray-400 mt-4">Recebida em {new Date(selectedMessage.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              Selecione uma mensagem para visualizar
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inscricao" element={<EnrollmentPage />} />
          <Route path="/painel" element={<ProtectedRoute><DashboardLayout><DashboardHome /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/alunos" element={<ProtectedRoute><DashboardLayout><StudentsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/turmas" element={<ProtectedRoute><DashboardLayout><ClassesPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/presenca" element={<ProtectedRoute><DashboardLayout><AttendancePage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/pagamentos" element={<ProtectedRoute><DashboardLayout><PaymentsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/caixa" element={<ProtectedRoute><DashboardLayout><CashFlowPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/relatorios" element={<ProtectedRoute><DashboardLayout><ReportsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/site" element={<ProtectedRoute adminOnly><DashboardLayout><SiteSettingsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/galeria" element={<ProtectedRoute adminOnly><DashboardLayout><GalleryPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/projetos" element={<ProtectedRoute adminOnly><DashboardLayout><ProjectsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/depoimentos" element={<ProtectedRoute adminOnly><DashboardLayout><TestimonialsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/painel/mensagens" element={<ProtectedRoute adminOnly><DashboardLayout><MessagesPage /></DashboardLayout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
