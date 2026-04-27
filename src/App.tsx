import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Wind, 
  Droplets, 
  Gauge, 
  Thermometer, 
  CloudRain, 
  Sun, 
  Cloud, 
  Loader2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  fetchWeatherByCoords, 
  fetchForecastByCoords, 
  fetchWeatherByCity,
  fetchForecastByCity,
  WeatherData,
  ForecastData
} from './services/weatherService';

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState('');

  const loadData = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      const [currentData, forecastData] = await Promise.all([
        fetchWeatherByCoords(lat, lon),
        fetchForecastByCoords(lat, lon)
      ]);
      setWeather(currentData);
      setForecast(forecastData);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data cuaca.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const [currentData, forecastData] = await Promise.all([
        fetchWeatherByCity(searchCity),
        fetchForecastByCity(searchCity)
      ]);
      setWeather(currentData);
      setForecast(forecastData);
      setSearchCity('');
    } catch (err: any) {
      setError('Kota tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser Anda.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadData(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError('Gagal mendapatkan lokasi. Silakan cari kota secara manual.');
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050b18]">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] ambient-glow-blue rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] ambient-glow-purple rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto p-6 md:p-8 flex flex-col min-h-screen">
        {/* Header Navigation */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 frosted-card flex items-center justify-center rounded-2xl">
              <MapPin className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {weather?.city || 'Mencari Lokasi...'}
              </h1>
              <p className="text-xs text-blue-300 font-bold tracking-widest uppercase">
                {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative flex-grow md:w-80">
              <input 
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Cari kota..."
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-full py-2.5 px-12 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-gray-500 text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <button type="submit" className="hidden"></button>
            </form>
            
            <button 
              onClick={getLocation}
              className="w-11 h-11 frosted-card rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-400 rounded-full animate-spin"></div>
              <p className="text-blue-300 font-medium tracking-widest uppercase text-xs">Memperbarui Cuaca</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-grow flex flex-col items-center justify-center text-center p-8 frosted-card rounded-[32px] max-w-lg mx-auto"
            >
              <AlertCircle className="w-16 h-16 text-red-400 mb-6" />
              <h2 className="text-2xl font-bold mb-2">Waduh, terjadi kesalahan!</h2>
              <p className="text-gray-400 mb-8">{error}</p>

              <button 
                onClick={getLocation}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                Coba Lagi
              </button>
            </motion.div>
          ) : weather && (
            <div className="grid grid-cols-12 gap-8 flex-grow">
              {/* Main Column */}
              <div className="col-span-12 lg:col-span-8 flex flex-col space-y-8">
                
                {/* Hero Weather Card */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="frosted-card rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group"
                >
                  <div className="relative z-10 text-center md:text-left">
                    <p className="text-xl font-medium text-blue-200 mb-2">Cuaca Hari Ini</p>
                    <h2 className="text-[120px] font-black leading-none mb-4 tracking-tighter text-shadow-glow">
                      {weather.temp}°<span className="text-blue-400 font-light">C</span>
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <span className="text-3xl text-white font-bold capitalize">{weather.description}</span>
                      <span className="px-4 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg border border-green-500/30 uppercase tracking-widest">
                        Udara Sehat
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative mt-8 md:mt-0">
                    <div className="w-64 h-64 bg-blue-400/10 rounded-full absolute -top-10 -right-10 blur-3xl group-hover:bg-blue-400/20 transition-all duration-700"></div>
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                      alt={weather.description}
                      className="w-48 h-48 md:w-64 md:h-64 drop-shadow-[0_0_40px_rgba(34,211,238,0.4)] relative z-10 animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </motion.div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    label="Terasa Seperti" 
                    value={`${weather.feelsLike}°C`}
                    subLabel="Suhu riil"
                  />
                  <StatCard 
                    label="Kelembapan" 
                    value={`${weather.humidity}%`}
                    subLabel="Kadar air"
                  />
                  <StatCard 
                    label="Kec. Angin" 
                    value={`${weather.windSpeed} km/j`}
                    subLabel="Arah barat"
                  />
                  <StatCard 
                    label="Tekanan" 
                    value={`${weather.pressure}`}
                    subLabel="hPa"
                  />
                </div>

                {/* Subtitle for Visual Polish */}
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-black uppercase tracking-[0.25em] text-blue-400/60">Prakiraan Per Hari</h3>
                   <div className="h-px bg-white/5 flex-grow mx-8"></div>
                </div>
              </div>

              {/* Weekly Forecast Sidebar */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="col-span-12 lg:col-span-4"
              >
                <div className="frosted-card rounded-[40px] p-8 h-full flex flex-col border-white/5">
                  <h3 className="text-xl font-bold mb-8">Prakiraan 5 Hari</h3>
                  <div className="space-y-6 flex-grow">
                    {forecast.map((day, idx) => (
                      <div key={day.dt} className="flex items-center justify-between group">
                        <span className="w-16 text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                          {format(new Date(day.dt * 1000), 'EEEE', { locale: id })}
                        </span>
                        <div className="flex items-center space-x-3">
                          <img 
                            src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                            alt={day.description}
                            className="w-10 h-10 drop-shadow-md"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-xs text-blue-300 font-medium capitalize hidden sm:inline">{day.description}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-black text-lg">{day.temp}°</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sunrise/Sunset Widget */}
                  <div className="mt-10 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-[24px]">
                    <div className="flex justify-between items-center text-center">
                      <div className="space-y-1">
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Terbit</p>
                        <p className="text-xl font-black">05:42</p>
                      </div>
                      <div className="w-px h-10 bg-white/10"></div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Terbenam</p>
                        <p className="text-xl font-black">17:58</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer Branding */}
        <footer className="mt-12 py-8 flex flex-col md:flex-row justify-between items-center opacity-30 gap-4 border-t border-white/5">
          <p className="text-[10px] tracking-[0.3em] font-black uppercase">Data Real-time oleh OpenWeather</p>
          <div className="flex space-x-6">
            <p className="text-[10px] tracking-widest uppercase font-bold">CuacaKita v2.0</p>
            <p className="text-[10px] tracking-widest uppercase font-bold">Akurat & Terpercaya</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, subLabel }: { label: string, value: string, subLabel: string }) {
  return (
    <div className="weather-stats-card rounded-[28px] p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
      <p className="text-blue-300/50 text-[10px] font-black tracking-widest uppercase mb-4">{label}</p>
      <p className="text-2xl font-black text-white mb-1 leading-none">{value}</p>
      <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase opacity-0 group-hover:opacity-100">{subLabel}</p>
    </div>
  );
}

