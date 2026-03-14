import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

const AUDITED_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (!AUDITED_METHODS.includes(method)) {
      return next.handle();
    }

    // Only audit release-related routes
    const url: string = req.url;
    const releaseMatch = url.match(/\/api\/releases\/([0-9a-f-]{36})/);
    if (!releaseMatch) {
      return next.handle();
    }

    const releaseId = releaseMatch[1];
    const userId = req.user?.userId;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    return next.handle().pipe(
      tap(() => {
        const description = this.buildDescription(method, controller, handler, req.body);
        this.audit.log(releaseId, description, userId).catch(() => {});
      }),
    );
  }

  private buildDescription(
    method: string,
    controller: string,
    handler: string,
    _body: any,
  ): string {
    if (method === 'DELETE') return 'Deleted release';
    if (controller === 'DocumentsController') {
      if (handler === 'updateLanguage') return 'Updated document content';
      if (handler === 'createDocument') return 'Added document';
      if (handler === 'deleteDocument') return 'Removed document';
      if (handler === 'updateContact') return 'Updated contact info';
    }
    if (controller === 'ReleasesController') {
      if (handler === 'update') return 'Updated release metadata';
      if (handler === 'updateAssociations') return 'Updated release categories';
    }
    return `${method} ${handler}`;
  }
}
