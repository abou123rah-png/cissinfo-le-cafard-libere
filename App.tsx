
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDailyReview, generateCaricature, generateAudioBila } from './services/geminiService';
import { AppState, DailyReview } from './types';

// Components
const Header: React.FC<{ date: string }> = ({ date }) => (
  <header class="gradient-header sticky top-0 z-50 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center gap-3">
          <div class="bg-white/90 p-1.5 rounded-full shadow-sm flex items-center justify-center">
            <span class="material-symbols-outlined text-senegal-green text-2xl">pest_control</span>
          </div>
          <div class="flex flex-col">
            <h1 class="text-white font-serif font-bold text-xl leading-tight tracking-wide drop-shadow-md">Le Cafard Libéré</h1>
            <span class="text-white/90 text-[10px] font-medium uppercase tracking-wider">L'édition du Jour - Mr Cissé</span>
          </div>
        </div>
        <div class="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30">
          <span class="material-symbols-outlined text-white text-sm">calendar_today</span>
          <span class="text-white text-sm font-semibold">{date}</span>
        </div>
        <div class="flex items-center gap-3">
          <button class="bg-white/90 hover:bg-white text-senegal-green px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
            <span class="material-symbols-outlined text-[20px]">account_circle</span>
            <span class="hidden sm:inline">Mr Cissé</span>
          </button>
        </div>
      </div>
    </div>
  </header>
);

const AudioPlayer: React.FC<{ text: string }> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const playAudio = async () => {
    if (isPlaying) {
      sourcesRef.current.forEach(s => s.stop());
      sourcesRef.current.clear();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      const base64 = await generateAudioBila(text);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      
      const bytes = decode(base64);
      const buffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsPlaying(false);
      
      sourcesRef.current.add(source);
      source.start();
    } catch (err) {
      console.error("Audio playback error:", err);
      setIsPlaying(false);
    }
  };

  return (
    <button 
      onClick={playAudio}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold shadow-md transition-all active:scale-95 ${
        isPlaying ? 'bg-senegal-red text-white' : 'bg-senegal-green hover:bg-senegal-green/90 text-white'
      }`}
    >
      <span className="material-symbols-outlined">{isPlaying ? 'stop_circle' : 'play_circle'}</span>
      <span>{isPlaying ? "Arrêter l'Audio-Bila" : "Écouter l'Audio-Bila"}</span>
    </button>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    review: null,
    caricatureUrl: null,
    isLoading: true,
    isAudioPlaying: false,
    error: null,
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const review = await fetchDailyReview(today);
      const caricature = await generateCaricature(review.caricatureCaption);
      
      setState({
        review,
        caricatureUrl: caricature,
        isLoading: false,
        isAudioPlaying: false,
        error: null
      });
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: "Impossible de charger la revue de presse. Veuillez réessayer." }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-off-white text-senegal-green">
        <div className="animate-spin mb-4">
          <span className="material-symbols-outlined text-6xl">pest_control</span>
        </div>
        <p className="font-serif italic text-lg">Le Cafard s'active pour Mr Cissé...</p>
        <p className="text-sm mt-2 opacity-70">Analyse des sources en cours...</p>
      </div>
    );
  }

  if (state.error || !state.review) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-off-white">
        <span className="material-symbols-outlined text-senegal-red text-6xl mb-4">error</span>
        <h2 className="text-2xl font-serif mb-2">{state.error || "Une erreur est survenue"}</h2>
        <button onClick={loadData} className="px-6 py-2 bg-senegal-green text-white rounded-lg font-bold">Réessayer</button>
      </div>
    );
  }

  const { review, caricatureUrl } = state;

  return (
    <div className="min-h-screen flex flex-col">
      <Header date={review.date} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow">
        {/* Top Section: Caricature & Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col h-full">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full border-l-4 border-senegal-red flex flex-col">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="font-serif font-bold text-lg text-gray-900">La Caricature du Jour</h2>
                <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full uppercase">Satire</span>
              </div>
              <div className="relative flex-1 bg-gray-100 min-h-[400px] flex items-center justify-center overflow-hidden group">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                  style={{ backgroundImage: `url('${caricatureUrl}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                  <p className="text-white font-serif italic text-xl text-center leading-tight">
                    "{review.caricatureCaption}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-senegal-red p-8 h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <span className="material-symbols-outlined text-[12rem]">article</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="font-serif font-bold text-3xl text-slate-800">Synthèse Express</h2>
                  <span className="bg-senegal-green/10 text-senegal-green px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Résumé Exécutif</span>
                </div>
                <div className="space-y-6 text-slate-700 leading-relaxed">
                  <p className="font-medium text-xl text-senegal-green">L'essentiel stratégique pour M. Cissé.</p>
                  <p className="text-lg italic font-serif text-slate-600 border-l-2 border-senegal-yellow pl-4">
                    {review.summary}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
                    <span className="material-symbols-outlined text-senegal-red">priority_high</span>
                    <p className="font-semibold">Question de Débat : <span className="text-slate-800">{review.debateQuestion}</span></p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-4 items-center border-t border-gray-100 pt-6">
                <AudioPlayer text={`${review.summary} ... Aujourd'hui, je vous pose cette question : ${review.debateQuestion}`} />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="material-symbols-outlined text-senegal-red">timer</span>
                  <span>Lecture: 2 min</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Middle Section: News List & Sidebar */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between border-b border-senegal-yellow pb-2">
              <h3 className="font-serif font-bold text-2xl text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-senegal-red">breaking_news_alt_1</span>
                Les 3 Titres Majeurs
              </h3>
            </div>
            
            <div className="space-y-6">
              {review.headlines.map((item, idx) => (
                <article key={idx} className="bg-white rounded-lg shadow-sm border-l-4 border-senegal-red p-6 hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="sm:w-40 sm:h-28 w-full h-48 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                      <img 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        src={`https://picsum.photos/400/300?random=${idx}`} 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-senegal-green/5 text-senegal-green text-[10px] font-bold rounded border border-senegal-green/10 uppercase tracking-widest">{item.category}</span>
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">share</span> {item.source}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-xl text-slate-800 mb-2 leading-tight group-hover:text-senegal-green transition-colors">{item.title}</h4>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{item.content}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border ${item.confidence > 85 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                          <span className="material-symbols-outlined text-[14px]">{item.confidence > 85 ? 'verified' : 'info'}</span> 
                          Indice Confiance: {item.confidence}% {item.confidence > 85 ? '🟢 Fiable' : '🟡 À confirmer'}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Debate Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-serif font-bold text-lg text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-600">forum</span>
                  Le Débat du Jour
                </h3>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-px bg-slate-200"></div>
                
                <div className="space-y-4">
                  <h4 className="text-senegal-green font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">check_circle</span> POUR
                  </h4>
                  <p className="font-serif font-bold text-lg leading-snug">"{review.debateDetails.pro}"</p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      <img className="h-full w-full object-cover" src={`https://picsum.photos/100/100?random=pro`} alt="Expert" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{review.debateDetails.proExpert}</p>
                      <p className="text-[10px] text-slate-500">Contributeur Expert</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-senegal-red font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">cancel</span> CONTRE (NUANCE)
                  </h4>
                  <p className="font-serif font-bold text-lg leading-snug">"{review.debateDetails.con}"</p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      <img className="h-full w-full object-cover" src={`https://picsum.photos/100/100?random=con`} alt="Expert" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{review.debateDetails.conExpert}</p>
                      <p className="text-[10px] text-slate-500">Sociologue Analyste</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Mot de l'Enseignant */}
            <div className="bg-senegal-yellow/10 rounded-xl border border-senegal-yellow/30 p-6 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <span className="material-symbols-outlined text-6xl">school</span>
              </div>
              <div className="mb-4">
                <span className="bg-senegal-yellow text-slate-900 px-3 py-1 rounded shadow-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 w-fit">
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  Le Mot de l'Enseignant
                </span>
              </div>
              <p className="font-serif text-slate-800 italic leading-relaxed text-lg border-l-2 border-senegal-green pl-4">
                {review.motEnseignant}
              </p>
              <div className="mt-4 text-right">
                <span className="text-xs font-bold text-senegal-green">— M. Cissé</span>
              </div>
            </div>

            {/* Innovation Section */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-senegal-red p-6">
              <h3 className="font-serif font-bold text-lg text-slate-800 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">rocket_launch</span>
                Innovation 'Tech Galsen'
              </h3>
              <div className="space-y-4 group cursor-pointer">
                <div className="h-32 w-full bg-slate-100 rounded-lg overflow-hidden relative">
                  <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">Start-up</div>
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform" src="https://picsum.photos/400/200?random=tech" alt="Innovation" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-senegal-green transition-colors">{review.innovation.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{review.innovation.description}</p>
                </div>
              </div>
              <button className="w-full mt-6 text-center text-senegal-green text-xs font-bold hover:underline py-2 border border-slate-100 rounded hover:bg-slate-50 transition-colors">Explorer plus d'innovations</button>
            </div>

            {/* Opportunities Section */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-senegal-red p-6">
              <h3 className="font-serif font-bold text-lg text-slate-800 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-senegal-green">trending_up</span>
                Opportunités & Éco
              </h3>
              <ul className="space-y-4">
                {review.opportunities.map((opp, idx) => (
                  <li key={idx} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <a className="group block" href="#">
                      <span className="text-[10px] text-senegal-green font-bold uppercase block mb-1 tracking-widest">{opp.type}</span>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-senegal-green transition-colors">{opp.title}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Date limite: {opp.deadline}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sources */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Sources Analysées</h4>
              <div className="flex flex-wrap gap-2">
                {review.sources.map((source, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white border border-slate-200 text-[10px] text-slate-600 font-bold rounded shadow-sm hover:border-senegal-green transition-colors cursor-default">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>

      <footer className="bg-slate-900 text-white py-12 mt-16 border-t-8 border-senegal-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-full">
                <span className="material-symbols-outlined text-senegal-yellow text-3xl">pest_control</span>
              </div>
              <div>
                <h2 className="font-serif font-bold text-2xl">Le Cafard Libéré</h2>
                <p className="text-xs text-slate-400 tracking-widest uppercase font-semibold">Rigueur, Satire & Éducation</p>
              </div>
            </div>
            
            <div className="flex flex-col md:items-end gap-4 text-center md:text-right">
              <div className="flex gap-6 text-sm font-medium text-slate-400">
                <a className="hover:text-senegal-yellow transition-colors" href="#">Mentions Légales</a>
                <a className="hover:text-senegal-yellow transition-colors" href="#">Confidentialité</a>
                <a className="hover:text-senegal-yellow transition-colors" href="#">Contact</a>
              </div>
              <p className="text-xs text-slate-500">© 2024 Le Cafard Libéré - Mr Cissé. Tous droits réservés.</p>
              <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">Propulsé par Gemini AI pour une analyse de presse moderne et panafricaine.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
