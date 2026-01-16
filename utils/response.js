class Response {
    constructor(data = null, message = null) {
        this.data = data;
        this.message = message;
    }

    success(res) {
        return res.status(200).json({
            success: true,
            data: this.data,
            message: this.message ?? "İşlem Başarılı"
        });
    }

    error500(res) {
        return res.status(500).json({
            success: false,
            message: this.message ?? "Sunucu Hatası"
        });
    }

    error400(res) {
        return res.status(400).json({
            success: false,
            message: this.message ?? "Hatalı İstek"
        });
    }

    error401(res) {
        return res.status(401).json({
            success: false,
            message: this.message ?? "Yetkisiz Erişim"
        });
    }

    error404(res) {
        return res.status(404).json({
            success: false,
            message: this.message ?? "Bulunamadı"
        });
    }
}

module.exports = Response;