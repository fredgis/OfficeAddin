import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
  makeStyles,
} from '@fluentui/react-components';
import type { Workspace, Report, ReportPage } from '../types/powerbi';

const useStyles = makeStyles({
  root: {
    width: '100%',
  },
});

interface BreadcrumbNavProps {
  workspace: Workspace | null;
  report: Report | null;
  page: ReportPage | null;
  onNavigateWorkspaces: () => void;
  onNavigateReports: () => void;
  onNavigatePages: () => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  workspace,
  report,
  page,
  onNavigateWorkspaces,
  onNavigateReports,
  onNavigatePages,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.root} role="navigation" aria-label="Workspace navigation">
      <Breadcrumb aria-label="Workspace breadcrumb">
        <BreadcrumbItem>
          <BreadcrumbButton onClick={onNavigateWorkspaces}>Workspaces</BreadcrumbButton>
        </BreadcrumbItem>
        {workspace && (
          <>
            <BreadcrumbDivider />
            <BreadcrumbItem>
              <BreadcrumbButton onClick={onNavigateReports} current={!report}>
                {workspace.name}
              </BreadcrumbButton>
            </BreadcrumbItem>
          </>
        )}
        {report && (
          <>
            <BreadcrumbDivider />
            <BreadcrumbItem>
              <BreadcrumbButton onClick={onNavigatePages} current={!page}>
                {report.name}
              </BreadcrumbButton>
            </BreadcrumbItem>
          </>
        )}
        {page && (
          <>
            <BreadcrumbDivider />
            <BreadcrumbItem>
              <BreadcrumbButton current>{page.displayName}</BreadcrumbButton>
            </BreadcrumbItem>
          </>
        )}
      </Breadcrumb>
    </div>
  );
};
