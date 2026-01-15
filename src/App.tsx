import { t } from "i18next";
import { AudioManager } from "./components/AudioManager";
import Transcript from "./components/Transcript";
import { useTranscriber } from "./hooks/useTranscriber";
import { Trans, useTranslation } from "react-i18next";
import LanguageSelector from "./components/LanguageSelector";

function App() {
    const transcriber = useTranscriber();

    const { i18n } = useTranslation();

    const handleChangeLanguage = (newLanguage: string) => {
        i18n.changeLanguage(newLanguage);
    };

    return (
        <>
            <div className='flex flex-col items-center min-h-screen py-4 pb-24 md:pb-10'>
                {/* Header + controls (non-growing) */}
                <div className='container flex flex-col items-center flex-shrink-0'>
                    <h1 className='text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl text-center'>
                        {t("app.title")}
                    </h1>
                    <h2 className='mt-3 mb-5 px-4 text-center text-1xl font-semibold tracking-tight text-slate-900 sm:text-2xl'>
                        {t("app.subtitle")}
                    </h2>
                    <AudioManager transcriber={transcriber} />
                </div>

                {/* Transcript workspace (grows and scrolls within viewport) */}
                <div className='container flex-1 overflow-hidden'>
                    <Transcript transcribedData={transcriber.output} />
                </div>

                {/* Footer (non-growing) */}
                <div className='flex-shrink-0 mt-auto w-full bg-white border-t border-gray-200'>
                    <footer className='text-center py-4 px-2 text-xs sm:text-sm mb-14 md:mb-0'>
                        <div className='mb-2'>
                            <b>{t("app.footer")}</b>
                        </div>
                        <div className='mb-2'>
                            <Trans
                                i18nKey='app.footer_credits'
                                components={{
                                    authorLink: (
                                        <a
                                            className='underline'
                                            href='https://github.com/BUsavsjo/whisper-web'
                                        />
                                    ),
                                    demoLink: (
                                        <a
                                            className='underline'
                                            href='https://github.com/Xenova/whisper-web'
                                        />
                                    ),
                                }}
                            />
                        </div>
                        <div>
                            <a
                                className='underline text-xs'
                                href='https://www.linkedin.com/in/peter-wenstr%C3%B6m-99515450/'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                LinkedIn
                            </a>
                        </div>
                    </footer>
                </div>
            </div>
            <div className='fixed bottom-0 left-0 right-0 z-40 flex justify-center py-2 pointer-events-none md:inset-auto md:bottom-4 md:right-16 md:py-0 md:pointer-events-auto'>
                <LanguageSelector
                    className='pointer-events-auto'
                    currentLanguage={i18n.language}
                    onChangeLanguage={handleChangeLanguage}
                />
            </div>
        </>
    );
}

export default App;
