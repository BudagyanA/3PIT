const express = require('express');
const app = express();
const port = 8080;
const path = require('path');
const session = require('express-session');

const passport = require('passport');
const YandexStrategy = require('passport-yandex').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

app.use(session({ secret: "supersecret", resave: true, saveUninitialized: true }));

let Users = [{'login': 'admin', 'email':'Aks-fam@yandex.ru'},
            {'login': 'local_js_god', 'email':'ilia-gossoudarev@yandex.ru'}];

const findUserByLogin = (login) => {
    return Users.find((element)=> {
        return element.login == login;
    })
}

const findUserByEmail = (email) => {
    return Users.find((element)=> {
        return element.email.toLowerCase() == email.toLowerCase();
    })
}

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
    done(null, user.login);
  });
  //user - объект, который Passport создает в req.user
passport.deserializeUser((login, done) => {
    user = findUserByLogin(login);
        done(null, user);
});

passport.use(new YandexStrategy({
    clientID: 'b4e90d1da2f244ccbaf6790a4cf5c28d',
    clientSecret: 'cb2d4ba5876c4a1c831f863c07768ee8',
    callbackURL: "http://localhost:8080/auth/yandex/callback"
  },
  (accessToken, refreshToken, profile, done) => {

    let user = findUserByEmail(profile.emails[0].value);
    if (user === undefined) {
        user = {
            'login': profile._json.login,
            'email': profile._json.default_email
        }
        Users.push(user);

    }

    user.profile = profile;
    return done(null, user);

  }
));

passport.use(new GitHubStrategy({
    clientID: 'eb297077e753b3e71c2c',
    clientSecret: '0ba6c4460cdffb29ec375d6e1f4ce72ff881ed41',
    callbackURL: "http://localhost:8080/auth/github/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);
    if (user === undefined) {
        user = {
            'login': profile.username,
            'email': profile._json.default_email
        }
        Users.push(user);

    }

    user.profile = profile;
    return done(null, user);

  }
));

const isAuth = (req, res, next)=> {
    if (req.isAuthenticated()) return next();
    res.redirect('/sorry');
}


app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'main.html'));
});

app.get('/sorry', (req, res)=> {
    res.sendFile(path.join(__dirname, 'sorry.html'));
});

app.get('/auth/yandex', passport.authenticate('yandex'));

app.get('/auth/yandex/callback', passport.authenticate('yandex', {
    failureRedirect: '/sorry', successRedirect: '/private'
}));

app.get('/private', isAuth, (req, res)=>{
    res.send(req.user);
});

app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback', passport.authenticate('github', {
    failureRedirect: '/sorry', successRedirect: '/private'
}));

app.listen(port, () => console.log(`App listening on port ${port}!`))
