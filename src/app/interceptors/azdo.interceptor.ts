import { inject } from '@angular/core';
import { HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../services/config.service';

export function azdoInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const config = inject(ConfigService);
    const base = req.url.startsWith('_apis') ? `https://dev.azure.com/${config.org}/${config.project}/` : '';
    const cloned = req.clone(
        {
            url: `${base}${req.url}`, setHeaders: { Authorization: `Basic ${config.auth}` }
        });
    return next(cloned);

}
