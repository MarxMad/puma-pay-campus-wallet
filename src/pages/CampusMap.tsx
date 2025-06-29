import React, { useState, useCallback } from 'react';
import { ArrowLeft, MapPin, Search, Filter, Percent, QrCode, Star, Clock, Phone, Navigation, List, Map, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';

// Datos actualizados con ubicaciones reales de Ciudad Universitaria UNAM
const campusPlaces = [
  {
    id: 1,
    name: "Cafetería Central UNAM",
    type: "food",
    icon: "🍕",
    distance: "50m",
    discount: 15,
    rating: 4.5,
    hours: "7:00 - 20:00",
    phone: "55-1234-5678",
    description: "Desayunos, comidas y antojitos universitarios",
    location: { lat: 19.3320, lng: -99.1860 }, // Torre de Rectoría área
    qrCode: "CAFE-CENTRAL-001",
    specialOffers: [
      "15% descuento en comidas completas",
      "2x1 en café con credencial estudiantil",
      "Menú del día $45 pesos"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: true,
    realLocation: "Cerca de Torre de Rectoría"
  },
  {
    id: 2,
    name: "Librería Universitaria", 
    type: "books",
    icon: "📚",
    distance: "120m",
    discount: 10,
    rating: 4.3,
    hours: "8:00 - 18:00",
    phone: "55-9876-5432",
    description: "Libros académicos y materiales de estudio",
    location: { lat: 19.3315, lng: -99.1840 }, // Centro Cultural Universitario
    qrCode: "LIBRERIA-UNI-002",
    specialOffers: [
      "10% descuento en libros de texto",
      "5% adicional por pago con PumaPay",
      "Envío gratis en compras +$500"
    ],
    paymentMethods: ["PumaPay", "Tarjeta"],
    popular: false,
    realLocation: "Centro Cultural Universitario"
  },
  {
    id: 3,
    name: "Gimnasio Pumas",
    type: "sports", 
    icon: "🏃‍♂️",
    distance: "200m",
    discount: 20,
    rating: 4.7,
    hours: "6:00 - 22:00",
    phone: "55-5555-1234",
    description: "Instalaciones deportivas completas CU",
    location: { lat: 19.3280, lng: -99.1920 }, // Zona deportiva
    qrCode: "GYM-PUMAS-003",
    specialOffers: [
      "20% descuento en mensualidades",
      "Registro gratuito con PumaPay",
      "Clases grupales incluidas"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Transferencia"],
    popular: true,
    realLocation: "Ciudad Deportiva CU"
  },
  {
    id: 4,
    name: "Copy Center FES",
    type: "services",
    icon: "🖨️", 
    distance: "80m",
    discount: 5,
    rating: 4.1,
    hours: "7:30 - 19:00",
    phone: "55-2468-1357",
    description: "Impresiones, copias y encuadernado",
    location: { lat: 19.3340, lng: -99.1880 }, // Zona de Facultades
    qrCode: "COPY-FES-004",
    specialOffers: [
      "5% descuento en impresiones",
      "Encuadernado gratuito +100 hojas",
      "Impresión a color -10%"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: false,
    realLocation: "Conjunto de Facultades"
  },
  {
    id: 5,
    name: "Tienda Universitaria",
    type: "shopping",
    icon: "🛍️",
    distance: "150m", 
    discount: 12,
    rating: 4.4,
    hours: "9:00 - 19:00",
    phone: "55-1357-2468",
    description: "Artículos UNAM y souvenirs oficiales",
    location: { lat: 19.3310, lng: -99.1850 }, // Centro de CU
    qrCode: "TIENDA-UNI-005",
    specialOffers: [
      "12% descuento en merchandising",
      "Playeras UNAM 2x1",
      "Accesorios universitarios -15%"
    ],
    paymentMethods: ["PumaPay", "Tarjeta", "Efectivo"],
    popular: true,
    realLocation: "Plaza Central CU"
  },
  {
    id: 6,
    name: "Farmacia Campus",
    type: "health",
    icon: "💊",
    distance: "90m",
    discount: 8,
    rating: 4.2,
    hours: "8:00 - 20:00", 
    phone: "55-9999-8888",
    description: "Medicamentos y productos de salud",
    location: { lat: 19.3300, lng: -99.1870 }, // Zona médica CU
    qrCode: "FARMACIA-CAM-006",
    specialOffers: [
      "8% descuento en medicamentos",
      "Consulta médica gratuita",
      "Productos de higiene -5%"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: false,
    realLocation: "Zona Médica CU"
  },
  // Nuevos lugares reales de CU
  {
    id: 7,
    name: "Biblioteca Central",
    type: "books",
    icon: "📖",
    distance: "180m",
    discount: 0,
    rating: 4.8,
    hours: "7:00 - 22:00",
    phone: "55-5622-1616",
    description: "Biblioteca Central Juan José Arreola",
    location: { lat: 19.3316, lng: -99.1850 },
    qrCode: "BIBLIO-CENTRAL-007",
    specialOffers: [
      "Acceso 24/7 con credencial",
      "Reserva de cubículos gratuita",
      "Servicio de impresión económico"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: true,
    realLocation: "Biblioteca Central CU"
  },
  {
    id: 8,
    name: "Museo Universitario",
    type: "culture",
    icon: "🏛️",
    distance: "300m",
    discount: 25,
    rating: 4.6,
    hours: "10:00 - 18:00",
    phone: "55-5622-6972",
    description: "MUAC - Arte contemporáneo",
    location: { lat: 19.3290, lng: -99.1820 },
    qrCode: "MUAC-008",
    specialOffers: [
      "25% descuento estudiantes UNAM",
      "Entrada gratuita los domingos",
      "Talleres incluidos con entrada"
    ],
    paymentMethods: ["PumaPay", "Tarjeta", "Efectivo"],
    popular: true,
    realLocation: "Centro Cultural Universitario"
  },
  {
    id: 9,
    name: "Comedor Estudiantil",
    type: "food",
    icon: "🍽️",
    distance: "100m",
    discount: 30,
    rating: 4.0,
    hours: "8:00 - 16:00",
    phone: "55-5622-2500",
    description: "Comida económica para estudiantes",
    location: { lat: 19.3330, lng: -99.1890 },
    qrCode: "COMEDOR-EST-009",
    specialOffers: [
      "30% descuento con credencial vigente",
      "Desayunos desde $15 pesos",
      "Comida corrida $25 pesos"
    ],
    paymentMethods: ["PumaPay", "Efectivo"],
    popular: true,
    realLocation: "Zona Residencial Estudiantil"
  },
  {
    id: 10,
    name: "Centro Médico CU",
    type: "health",
    icon: "🏥",
    distance: "250m",
    discount: 0,
    rating: 4.3,
    hours: "24 horas",
    phone: "55-5622-2222",
    description: "Servicios médicos de emergencia",
    location: { lat: 19.3295, lng: -99.1875 },
    qrCode: "MEDICO-CU-010",
    specialOffers: [
      "Consultas gratuitas estudiantes",
      "Medicamentos a precio preferencial",
      "Servicio 24/7 disponible"
    ],
    paymentMethods: ["PumaPay", "Efectivo", "Tarjeta"],
    popular: false,
    realLocation: "Centro Médico CU"
  }
];

const typeFilters = [
  { id: 'all', name: 'Todos', icon: '🏢', color: 'bg-gray-500' },
  { id: 'food', name: 'Comida', icon: '🍕', color: 'bg-orange-500' },
  { id: 'books', name: 'Libros', icon: '📚', color: 'bg-blue-500' },
  { id: 'sports', name: 'Deportes', icon: '🏃‍♂️', color: 'bg-green-500' },
  { id: 'services', name: 'Servicios', icon: '🖨️', color: 'bg-purple-500' },
  { id: 'shopping', name: 'Tienda', icon: '🛍️', color: 'bg-pink-500' },
  { id: 'health', name: 'Salud', icon: '💊', color: 'bg-red-500' },
  { id: 'culture', name: 'Cultura', icon: '🏛️', color: 'bg-indigo-500' }
];

const CampusMap: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<number | null>(null);
  const [showQR, setShowQR] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  
  // Coordenadas reales de Ciudad Universitaria UNAM
  const [mapCenter] = useState({ lat: 19.321643312240475, lng: -99.22412730124401 });

  // Filtrar lugares según el filtro y búsqueda
  const filteredPlaces = campusPlaces.filter(place => {
    const matchesFilter = selectedFilter === 'all' || place.type === selectedFilter;
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         place.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const popularPlaces = campusPlaces.filter(place => place.popular);

  const generateQRCode = (qrCode: string) => {
    // Simulación de QR code con patrón visual
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PUMAPAY-${qrCode}`;
  };

  // Componente del Mapa Real de Google Maps (Solo el mapa, sin marcadores)
  const RealMapView = () => {
    return (
      <div className="relative w-full h-96 rounded-xl overflow-hidden shadow-2xl">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30120.76741252353!2d-99.22412730124401!3d19.321643312240475!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ce000920979a1b%3A0x7c9f3c0207ba804d!2zQy5VLiwgQ2l1ZGFkIGRlIE3DqXhpY28sIENETVgsIE3DqXhpY28!5e0!3m2!1ses!2sus!4v1751158527138!5m2!1ses!2sus"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de Ciudad Universitaria UNAM"
        />
        
        {/* Botón para abrir en Google Maps */}
        <div className="absolute top-4 right-4">
          <Button
            size="sm"
            onClick={() => window.open('https://maps.google.com/?q=Ciudad+Universitaria+UNAM+Mexico', '_blank')}
            className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white shadow-lg"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Google Maps
          </Button>
        </div>
        
        {/* Leyenda del mapa */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-700 shadow-lg">
          🏛️ Ciudad Universitaria UNAM
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-xl shadow-black/30">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Mapa del Campus</h1>
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md text-xs transition-all duration-200 ${
                viewMode === 'map' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Map className="h-3 w-3" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-xs transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar lugares en el campus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800/50 backdrop-blur-xl border-white/20 text-white pl-10 rounded-xl shadow-lg"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex overflow-x-auto space-x-3 pb-2">
          {typeFilters.map(filter => (
            <Button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 ${
                selectedFilter === filter.id
                  ? `${filter.color} text-white shadow-lg scale-105`
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <span>{filter.icon}</span>
              <span className="text-sm font-medium">{filter.name}</span>
            </Button>
          ))}
        </div>

        {/* Vista del Mapa */}
        {viewMode === 'map' && (
          <div className="space-y-4">
            <RealMapView />
            
            {/* Información del mapa */}
            <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">🗺️ Mapa de Ciudad Universitaria</h3>
                  <p className="text-sm text-gray-400">Vista real de Google Maps - Los lugares se mostrarán pronto</p>
                  <p className="text-xs text-blue-400 mt-1">📍 Coordenadas: 19.3216, -99.2241</p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div className="text-green-400 font-bold text-lg">🏛️</div>
                  <div className="text-xs">UNAM</div>
                  <div className="text-xs">Ciudad Universitaria</div>
                </div>
              </div>
            </Card>
            
            {/* QR Code Modal para vista de mapa */}
            {showQR && (
              <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white text-center">
                <h4 className="font-semibold text-blue-400 mb-3">📱 Código QR para Pagar</h4>
                <div className="bg-white p-4 rounded-xl inline-block mb-3">
                  <img 
                    src={generateQRCode(campusPlaces.find(p => p.id === showQR)?.qrCode || '')}
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  Escanea este código para pagar en {campusPlaces.find(p => p.id === showQR)?.name}
                </p>
                <p className="text-xs text-green-400 font-semibold mb-4">
                  ¡Obtén {campusPlaces.find(p => p.id === showQR)?.discount}% de descuento automáticamente!
                </p>
                <Button
                  onClick={() => setShowQR(null)}
                  variant="outline"
                  size="sm"
                  className="text-gray-300 border-gray-600 hover:bg-gray-700"
                >
                  Cerrar
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Vista de Lista */}
        {viewMode === 'list' && (
          <>
            {/* Popular Places */}
            {selectedFilter === 'all' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-white text-lg font-semibold">Lugares Populares</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {popularPlaces.map(place => (
                    <Card 
                      key={place.id}
                      className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-4 text-white hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer"
                      onClick={() => setSelectedPlace(selectedPlace === place.id ? null : place.id)}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="text-2xl">{place.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{place.name}</h3>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span>{place.distance}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Percent className="h-3 w-3 text-green-400" />
                          <span className="text-green-400 text-xs font-bold">{place.discount}% OFF</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs">{place.rating}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Places List */}
            <div className="space-y-4">
              <h2 className="text-white text-lg font-semibold">
                {selectedFilter === 'all' ? 'Todos los Lugares' : `${typeFilters.find(f => f.id === selectedFilter)?.name}`}
              </h2>
              
              <div className="space-y-3">
                {filteredPlaces.map(place => (
                  <Card 
                    key={place.id}
                    className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-5 text-white transition-all duration-300 hover:shadow-xl shadow-lg"
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => setSelectedPlace(selectedPlace === place.id ? null : place.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">{place.icon}</div>
                          <div>
                            <h3 className="font-bold text-lg">{place.name}</h3>
                            <p className="text-gray-300 text-sm">{place.description}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            <Percent className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 font-bold">{place.discount}% OFF</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-400 text-xs">{place.distance}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>{place.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{place.hours}</span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowQR(showQR === place.id ? null : place.id);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 p-2"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Detailed View */}
                    {selectedPlace === place.id && (
                      <div className="mt-4 pt-4 border-t border-gray-600 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {/* Special Offers */}
                        <div>
                          <h4 className="font-semibold text-orange-400 mb-2">🎁 Ofertas Especiales</h4>
                          <div className="space-y-1">
                            {place.specialOffers.map((offer, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-300">{offer}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-blue-400" />
                            <span className="text-sm">{place.phone}</span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600"
                              onClick={() => navigate('/send')}
                            >
                              Pagar Ahora
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* QR Code Modal */}
                    {showQR === place.id && (
                      <div className="mt-4 pt-4 border-t border-gray-600 text-center animate-in zoom-in-95 duration-300">
                        <h4 className="font-semibold text-blue-400 mb-3">📱 Código QR para Pagar</h4>
                        <div className="bg-white p-4 rounded-xl inline-block mb-3">
                          <img 
                            src={generateQRCode(place.qrCode)}
                            alt={`QR Code for ${place.name}`}
                            className="w-32 h-32"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          Escanea este código para pagar en {place.name}
                        </p>
                        <p className="text-xs text-green-400 font-semibold">
                          ¡Obtén {place.discount}% de descuento automáticamente!
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* No Results */}
            {filteredPlaces.length === 0 && (
              <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-8 text-center text-white">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay lugares disponibles</h3>
                <p className="text-gray-400 text-sm">
                  Intenta con otros filtros o términos de búsqueda
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CampusMap; 