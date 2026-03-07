from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "static", "uploads")

    db.init_app(app)
    migrate.init_app(app, db)

    # LoginManager 初期化
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"        # 未ログイン時のリダイレクト先
    login_manager.login_message = "ログインしてください。"
    login_manager.login_message_category = "warning"

    @login_manager.user_loader
    def load_user(user_id):
        from app.models import User
        return User.query.get(int(user_id))

    # ルート登録
    from app.routes import main
    app.register_blueprint(main)

    from app.auth import auth
    app.register_blueprint(auth)

    return app
