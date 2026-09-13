const fs = require('fs');
const path = 'src/components/PreLaunchPropertyDetailModal.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('import { useTranslation }')) {
    code = code.replace('import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";', 'import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";\nimport { useTranslation } from "@/hooks/useTranslation";');
    code = code.replace('export const PreLaunchPropertyDetailModal = ({', 'export const PreLaunchPropertyDetailModal = ({\n  isOpen,\n  onClose,\n  property\n}: PreLaunchPropertyDetailModalProps) => {\n  const { t } = useTranslation();');
    code = code.replace('  isOpen,', '');
    code = code.replace('  onClose,', '');
    code = code.replace('  property', '');
    code = code.replace('}: PreLaunchPropertyDetailModalProps) => {', '');
}

code = code.replace(/<span className="text-\[11px\] font-black text-slate-800 uppercase tracking-widest px-2 py-0\.5">Coming Soon<\/span>/g, '<span className="text-[11px] font-black text-slate-800 uppercase tracking-widest px-2 py-0.5">{t("comingSoon")}</span>');
code = code.replace(/Bookings Coming Soon/g, '{t("comingSoon")}');

fs.writeFileSync(path, code);
