import React, { useState, useCallback } from 'react';
import { ArrowLeft, MapPin, Search, Filter, Percent, QrCode, Star, Clock, Phone, Navigation, List, Map, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';

// Datos actualizados con ubicaciones reales del campus y fotos
const campusPlaces = [
  // COMIDA - Cafeterías
  {
    id: 1,
    name: "Cafetería Las Islas",
    type: "food",
    icon: "🍽️",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&crop=center",
    distance: "50m",
    discount: 20,
    rating: 4.5,
    hours: "7:00 - 20:00",
    phone: "55-1234-5678",
    description: "Chilaquiles con pollo, café americano y más",
    location: { lat: 19.3320, lng: -99.1860 },
    qrCode: "CAFE-ISLAS-001",
    specialOffers: [
      "Chilaquiles con pollo - 75 MXNB",
      "Café americano - 25 MXNB",
      "20% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Edificio de Ciencias"
  },
  {
    id: 2,
    name: "Cafetería Arquitectura",
    type: "food",
    icon: "🏗️",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center",
    distance: "80m",
    discount: 15,
    rating: 4.3,
    hours: "7:30 - 19:30",
    phone: "55-2345-6789",
    description: "Comida rápida y bebidas",
    location: { lat: 19.3315, lng: -99.1840 },
    qrCode: "CAFE-ARQ-002",
    specialOffers: [
      "Torta especial - 60 MXNB",
      "Agua fresca - 15 MXNB",
      "15% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: true,
    realLocation: "Facultad de Arquitectura"
  },
  {
    id: 3,
    name: "Cafetería Ingeniería",
    type: "food",
    icon: "⚙️",
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop&crop=center",
    distance: "120m",
    discount: 18,
    rating: 4.4,
    hours: "7:00 - 21:00",
    phone: "55-3456-7890",
    description: "Comida corrida y snacks",
    location: { lat: 19.3300, lng: -99.1820 },
    qrCode: "CAFE-ING-003",
    specialOffers: [
      "Comida corrida - 85 MXNB",
      "Refresco - 20 MXNB",
      "18% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Facultad de Ingeniería"
  },
  {
    id: 4,
    name: "Jugos Copilco",
    type: "food",
    icon: "🥤",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop&crop=center",
    distance: "200m",
    discount: 25,
    rating: 4.6,
    hours: "8:00 - 18:00",
    phone: "55-4567-8901",
    description: "Jugos naturales y smoothies",
    location: { lat: 19.3280, lng: -99.1800 },
    qrCode: "JUGOS-COPILCO-004",
    specialOffers: [
      "Jugo de naranja - 25 MXNB",
      "Smoothie de fresa - 35 MXNB",
      "25% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: true,
    realLocation: "Zona Copilco"
  },

  // LIBROS - Librerías
  {
    id: 5,
    name: "Librería Central",
    type: "books",
    icon: "📚",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center",
    distance: "100m",
    discount: 10,
    rating: 4.3,
    hours: "8:00 - 18:00",
    phone: "55-5678-9012",
    description: "Libros académicos y materiales",
    location: { lat: 19.3310, lng: -99.1850 },
    qrCode: "LIBRERIA-CENTRAL-005",
    specialOffers: [
      "Álgebra Lineal - 120 MXNB",
      "Cálculo Diferencial - 95 MXNB",
      "10% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Centro Cultural Universitario"
  },
  {
    id: 6,
    name: "Librería Ciencias",
    type: "books",
    icon: "🔬",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center",
    distance: "150m",
    discount: 12,
    rating: 4.2,
    hours: "8:30 - 17:30",
    phone: "55-6789-0123",
    description: "Libros especializados en ciencias",
    location: { lat: 19.3305, lng: -99.1830 },
    qrCode: "LIBRERIA-CIENCIAS-006",
    specialOffers: [
      "Física General - 110 MXNB",
      "Química Orgánica - 130 MXNB",
      "12% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: false,
    realLocation: "Facultad de Ciencias"
  },

  // DEPORTES - Gimnasios
  {
    id: 7,
    name: "Gimnasio Central",
    type: "sports",
    icon: "🏃‍♂️",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center",
    distance: "300m",
    discount: 25,
    rating: 4.7,
    hours: "6:00 - 22:00",
    phone: "55-7890-1234",
    description: "Gimnasio completo con alberca",
    location: { lat: 19.3270, lng: -99.1780 },
    qrCode: "GYM-CENTRAL-007",
    specialOffers: [
      "Membresía mensual - 200 MXNB",
      "Clase de natación - 50 MXNB",
      "25% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Deportivo Universitario"
  },
  {
    id: 8,
    name: "Gimnasio Frontones",
    type: "sports",
    icon: "🏓",
    image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop&crop=center",
    distance: "250m",
    discount: 20,
    rating: 4.4,
    hours: "7:00 - 21:00",
    phone: "55-8901-2345",
    description: "Frontones y canchas deportivas",
    location: { lat: 19.3285, lng: -99.1790 },
    qrCode: "GYM-FRONTONES-008",
    specialOffers: [
      "Renta de cancha - 80 MXNB/hora",
      "Clase de frontón - 40 MXNB",
      "20% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: false,
    realLocation: "Zona Deportiva"
  },

  // SERVICIOS
  {
    id: 9,
    name: "Centro de Copias",
    type: "services",
    icon: "📄",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop&crop=center",
    distance: "60m",
    discount: 15,
    rating: 4.1,
    hours: "8:00 - 19:00",
    phone: "55-9012-3456",
    description: "Copias, impresiones y encuadernado",
    location: { lat: 19.3318, lng: -99.1855 },
    qrCode: "COPIAS-CENTRAL-009",
    specialOffers: [
      "Copia blanco y negro - 1 MXNB",
      "Impresión color - 5 MXNB",
      "15% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: true,
    realLocation: "Biblioteca Central"
  },
  {
    id: 10,
    name: "Internet Café",
    type: "services",
    icon: "💻",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&crop=center",
    distance: "90m",
    discount: 20,
    rating: 4.0,
    hours: "24/7",
    phone: "55-0123-4567",
    description: "Acceso a internet y computadoras",
    location: { lat: 19.3312, lng: -99.1845 },
    qrCode: "INTERNET-CAFE-010",
    specialOffers: [
      "1 hora de internet - 20 MXNB",
      "Impresión - 3 MXNB",
      "20% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: false,
    realLocation: "Centro de Estudiantes"
  },
  {
    id: 11,
    name: "Papelería Universitaria",
    type: "services",
    icon: "✏️",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center",
    distance: "70m",
    discount: 10,
    rating: 4.2,
    hours: "8:30 - 18:30",
    phone: "55-1234-5678",
    description: "Material escolar y oficina",
    location: { lat: 19.3315, lng: -99.1852 },
    qrCode: "PAPELERIA-UNI-011",
    specialOffers: [
      "Cuaderno universitario - 25 MXNB",
      "Plumas y lápices - 15 MXNB",
      "10% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Edificio Administrativo"
  },

  // TIENDAS
  {
    id: 12,
    name: "Tienda Universitaria",
    type: "shop",
    icon: "🛍️",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center",
    distance: "110m",
    discount: 12,
    rating: 4.3,
    hours: "9:00 - 19:00",
    phone: "55-2345-6789",
    description: "Productos universitarios y souvenirs",
    location: { lat: 19.3308, lng: -99.1848 },
    qrCode: "TIENDA-UNI-012",
    specialOffers: [
      "Playera universitaria - 150 MXNB",
      "Taza conmemorativa - 80 MXNB",
      "12% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Centro Comercial"
  },
  {
    id: 13,
    name: "Puesto de Revistas",
    type: "shop",
    icon: "📰",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop&crop=center",
    distance: "140m",
    discount: 8,
    rating: 3.9,
    hours: "8:00 - 17:00",
    phone: "55-3456-7890",
    description: "Revistas, periódicos y snacks",
    location: { lat: 19.3302, lng: -99.1840 },
    qrCode: "PUESTO-REVISTAS-013",
    specialOffers: [
      "Revista científica - 45 MXNB",
      "Periódico - 15 MXNB",
      "8% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: false,
    realLocation: "Plaza Central"
  },

  // SALUD
  {
    id: 14,
    name: "Clínica Universitaria",
    type: "health",
    icon: "🏥",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop&crop=center",
    distance: "400m",
    discount: 30,
    rating: 4.8,
    hours: "7:00 - 20:00",
    phone: "55-4567-8901",
    description: "Servicios médicos para estudiantes",
    location: { lat: 19.3250, lng: -99.1750 },
    qrCode: "CLINICA-UNI-014",
    specialOffers: [
      "Consulta general - 50 MXNB",
      "Medicamentos básicos - 30 MXNB",
      "30% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Centro Médico Universitario"
  },
  {
    id: 15,
    name: "Veterinaria Campus",
    type: "health",
    icon: "🐕",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&crop=center",
    distance: "350m",
    discount: 20,
    rating: 4.5,
    hours: "9:00 - 18:00",
    phone: "55-5678-9012",
    description: "Cuidado veterinario para mascotas",
    location: { lat: 19.3260, lng: -99.1760 },
    qrCode: "VETERINARIA-CAMPUS-015",
    specialOffers: [
      "Consulta veterinaria - 100 MXNB",
      "Vacunas - 80 MXNB",
      "20% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: false,
    realLocation: "Zona Veterinaria"
  },
  {
    id: 16,
    name: "Odontología Estudiantil",
    type: "health",
    icon: "🦷",
    image: "https://images.unsplash.com/photo-1606811841689-23f52c2c4b2a?w=400&h=300&fit=crop&crop=center",
    distance: "380m",
    discount: 25,
    rating: 4.6,
    hours: "8:00 - 17:00",
    phone: "55-6789-0123",
    description: "Servicios dentales para estudiantes",
    location: { lat: 19.3255, lng: -99.1755 },
    qrCode: "ODONTOLOGIA-UNI-016",
    specialOffers: [
      "Limpieza dental - 120 MXNB",
      "Consulta dental - 60 MXNB",
      "25% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Centro Dental"
  },
  {
    id: 17,
    name: "Enfermería Central",
    type: "health",
    icon: "🏥",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop&crop=center",
    distance: "320m",
    discount: 15,
    rating: 4.4,
    hours: "24/7",
    phone: "55-7890-1234",
    description: "Primeros auxilios y atención básica",
    location: { lat: 19.3265, lng: -99.1765 },
    qrCode: "ENFERMERIA-CENTRAL-017",
    specialOffers: [
      "Primeros auxilios - Gratis",
      "Medicamentos básicos - 25 MXNB",
      "15% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: true,
    realLocation: "Centro de Salud"
  },

  // CULTURA
  {
    id: 18,
    name: "Museo Universitario",
    type: "culture",
    icon: "🏛️",
    image: "https://images.unsplash.com/photo-1555529902-1c8d2b3b3b3b?w=400&h=300&fit=crop&crop=center",
    distance: "500m",
    discount: 40,
    rating: 4.9,
    hours: "10:00 - 18:00",
    phone: "55-8901-2345",
    description: "Exposiciones y eventos culturales",
    location: { lat: 19.3200, lng: -99.1700 },
    qrCode: "MUSEO-UNI-018",
    specialOffers: [
      "Entrada general - 30 MXNB",
      "Visita guiada - 50 MXNB",
      "40% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Centro Cultural Universitario"
  },
  {
    id: 19,
    name: "Cine Universitario",
    type: "culture",
    icon: "🎬",
    image: "https://images.unsplash.com/photo-1489599808417-2b5b3b3b3b3b?w=400&h=300&fit=crop&crop=center",
    distance: "450m",
    discount: 35,
    rating: 4.7,
    hours: "12:00 - 22:00",
    phone: "55-9012-3456",
    description: "Películas y eventos cinematográficos",
    location: { lat: 19.3210, lng: -99.1710 },
    qrCode: "CINE-UNI-019",
    specialOffers: [
      "Boleto de película - 40 MXNB",
      "Palomitas - 25 MXNB",
      "35% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Centro Cultural"
  },
  {
    id: 20,
    name: "Teatro Universitario",
    type: "culture",
    icon: "🎭",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center",
    distance: "480m",
    discount: 30,
    rating: 4.8,
    hours: "19:00 - 22:00",
    phone: "55-0123-4567",
    description: "Obras de teatro y eventos artísticos",
    location: { lat: 19.3205, lng: -99.1705 },
    qrCode: "TEATRO-UNI-020",
    specialOffers: [
      "Boleto de teatro - 60 MXNB",
      "Programa de mano - 10 MXNB",
      "30% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Centro Cultural"
  },
  {
    id: 21,
    name: "Auditorio Principal",
    type: "culture",
    icon: "🎤",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&crop=center",
    distance: "520m",
    discount: 25,
    rating: 4.6,
    hours: "Eventos especiales",
    phone: "55-1234-5678",
    description: "Conferencias y eventos especiales",
    location: { lat: 19.3195, lng: -99.1695 },
    qrCode: "AUDITORIO-PRINCIPAL-021",
    specialOffers: [
      "Entrada a conferencia - 80 MXNB",
      "Material de apoyo - 20 MXNB",
      "25% descuento con PumaPay"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: false,
    realLocation: "Centro de Convenciones"
  }
];

const CampusMapPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedPlace, setSelectedPlace] = useState(null);

  const categories = [
    { id: 'all', name: 'Todos', icon: '🏢' },
    { id: 'food', name: 'Comida', icon: '🍕' },
    { id: 'books', name: 'Libros', icon: '📚' },
    { id: 'sports', name: 'Deportes', icon: '🏃‍♂️' },
    { id: 'services', name: 'Servicios', icon: '🖨️' },
    { id: 'shop', name: 'Tienda', icon: '🛍️' },
    { id: 'health', name: 'Salud', icon: '💊' },
    { id: 'culture', name: 'Cultura', icon: '🏛️' }
  ];

  const filteredPlaces = campusPlaces.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         place.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || place.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePlaceClick = useCallback((place) => {
    setSelectedPlace(place);
  }, []);

  const closePlaceDetails = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-black/30 backdrop-blur-xl border-b border-white/10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Mapa del Campus</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="text-gray-300 hover:text-white"
          >
            {viewMode === 'list' ? <Map className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar lugares en el campus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="px-4 mb-4">
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Places List */}
      <div className="px-4 space-y-3">
        {filteredPlaces.map((place) => (
          <Card
            key={place.id}
            className="bg-gray-800/50 backdrop-blur-xl border-white/20 overflow-hidden cursor-pointer hover:bg-gray-800/70 transition-all duration-300"
            onClick={() => handlePlaceClick(place)}
          >
            {/* Image */}
            <div className="relative h-48 w-full">
              <img
                src={place.image}
                alt={place.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/400x300/374151/ffffff?text=${place.name}`;
                }}
              />
              {/* Overlay with discount */}
              <div className="absolute top-3 right-3">
                <div className="bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold">
                  -{place.discount}%
                </div>
              </div>
              {/* Popular badge */}
              {place.popular && (
                <div className="absolute top-3 left-3">
                  <div className="bg-orange-500/90 text-white px-2 py-1 rounded-full text-xs font-bold">
                    Popular
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{place.icon}</span>
                  <h3 className="font-semibold text-sm text-white">{place.name}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-gray-400">{place.rating}</span>
                </div>
              </div>

              <p className="text-gray-300 text-xs mb-3">{place.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{place.distance}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{place.hours}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">{place.realLocation}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Place Details Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-white/20 p-6 text-white w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-lg">{selectedPlace.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedPlace.name}</h3>
                  <p className="text-gray-300 text-sm">{selectedPlace.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePlaceDetails}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Image in modal */}
            <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
              <img
                src={selectedPlace.image}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/400x300/374151/ffffff?text=${selectedPlace.name}`;
                }}
              />
            </div>

            <div className="space-y-4">
              {/* Rating and Distance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm">{selectedPlace.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{selectedPlace.distance}</span>
                  </div>
                </div>
                <div className="bg-green-500/20 border border-green-500/40 rounded-full px-3 py-1">
                  <span className="text-sm text-green-400 font-bold">-{selectedPlace.discount}% descuento</span>
                </div>
              </div>

              {/* Hours and Phone */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{selectedPlace.hours}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{selectedPlace.phone}</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center space-x-1 text-sm">
                <Navigation className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">{selectedPlace.realLocation}</span>
              </div>

              {/* Special Offers */}
              <div>
                <h4 className="font-semibold text-sm mb-2 text-orange-400">Ofertas especiales:</h4>
                <div className="space-y-2">
                  {selectedPlace.specialOffers.map((offer, index) => (
                    <div key={index} className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                      <p className="text-sm text-orange-300">{offer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Métodos de pago:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlace.paymentMethods.map((method, index) => (
                    <div key={index} className="bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1">
                      <span className="text-xs text-blue-400">{method}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="bg-white rounded-lg p-4 inline-block">
                  <QrCode className="h-16 w-16 text-gray-900 mx-auto" />
                </div>
                <p className="text-xs text-gray-400 mt-2">Código: {selectedPlace.qrCode}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Navigation className="h-4 w-4 mr-2" />
                  Direcciones
                </Button>
                <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                  <QrCode className="h-4 w-4 mr-2" />
                  Pagar con PumaPay
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CampusMapPage;